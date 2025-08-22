const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

function isOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart.toMillis() <= bEnd.toMillis() && bStart.toMillis() <= aEnd.toMillis();
}

async function hasConflict({ marketId, slotId, from, to }) {
  const snap = await db.collection('bookings')
    .where('marketId', '==', marketId)
    .where('slotId', '==', slotId)
    .where('status', 'in', ['pending','submitted','confirmed'])
    .get();
  for (const d of snap.docs) {
    const b = d.data();
    if (isOverlap(b.from, b.to, from, to)) return true;
  }

  const now = admin.firestore.Timestamp.now();
  const lockSnap = await db.collection('slotLocks')
    .where('marketId', '==', marketId)
    .where('slotId', '==', slotId)
    .where('status', '==', 'active')
    .where('expiresAt', '>', now)
    .get();
  for (const d of lockSnap.docs) {
    const l = d.data();
    if (isOverlap(l.from, l.to, from, to)) return true;
  }
  return false;
}

exports.holdSlot = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.');
  const { marketId, slotId, from, to } = data;
  const fromTs = admin.firestore.Timestamp.fromMillis(new Date(from).getTime());
  const toTs   = admin.firestore.Timestamp.fromMillis(new Date(to).getTime());
  const userId = context.auth.uid;

  if (await hasConflict({ marketId, slotId, from: fromTs, to: toTs })) {
    throw new functions.https.HttpsError('already-exists', 'This slot/time is already taken.');
  }

  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 10 * 60 * 1000);
  const lockId = `${slotId}_${fromTs.toMillis()}_${toTs.toMillis()}_${userId}`;

  await db.runTransaction(async (tx) => {
    const lockRef = db.collection('slotLocks').doc(lockId);
    const lockDoc = await tx.get(lockRef);
    if (lockDoc.exists) throw new functions.https.HttpsError('already-exists', 'You already hold this time.');
    tx.set(lockRef, {
      marketId, slotId, userId,
      from: fromTs, to: toTs,
      status: 'active',
      createdAt: now,
      expiresAt
    });
  });

  return { lockId, expiresAt: expiresAt.toDate().toISOString() };
});

exports.confirmBooking = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.');
  const { lockId, type, paymentSlipUrl } = data;
  const userId = context.auth.uid;

  await db.runTransaction(async (tx) => {
    const lockRef = db.collection('slotLocks').doc(lockId);
    const lockDoc = await tx.get(lockRef);
    if (!lockDoc.exists) throw new functions.https.HttpsError('failed-precondition', 'Lock not found.');
    const lock = lockDoc.data();
    if (lock.userId !== userId) throw new functions.https.HttpsError('permission-denied', 'Not your lock.');
    if (lock.status !== 'active') throw new functions.https.HttpsError('failed-precondition', 'Lock not active.');
    const now = admin.firestore.Timestamp.now();
    if (lock.expiresAt.toMillis() <= now.toMillis()) {
      throw new functions.https.HttpsError('deadline-exceeded', 'Lock expired.');
    }

    const conflict = await hasConflict({
      marketId: lock.marketId, slotId: lock.slotId, from: lock.from, to: lock.to
    });
    if (conflict) throw new functions.https.HttpsError('already-exists', 'Time just got taken.');

    const bookingRef = db.collection('bookings').doc();
    tx.set(bookingRef, {
      marketId: lock.marketId,
      slotId: lock.slotId,
      userId,
      type, // 'daily' | 'monthly'
      from: lock.from,
      to: lock.to,
      paymentSlipUrl: paymentSlipUrl || null,
      status: 'submitted',
      createdAt: now,
      updatedAt: now
    });

    tx.update(lockRef, { status: 'consumed' });
  });

  return { ok: true };
});

exports.notifyOnBookingWrite = functions.firestore
  .document('bookings/{bookingId}')
  .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;
    const now = admin.firestore.Timestamp.now();

    if (!before && after) {
      await db.collection('notifications').add({
        toUserId: after.userId,
        type: 'booking_created',
        title: 'สร้างคำขอจองเรียบร้อย',
        message: `คำขอจองของคุณถูกสร้างแล้ว (${after.marketId}/${after.slotId})`,
        data: { bookingId: context.params.bookingId, status: after.status },
        read: false,
        createdAt: now
      });
      return;
    }

    if (before && after && before.status !== after.status) {
      await db.collection('notifications').add({
        toUserId: after.userId,
        type: 'booking_status_changed',
        title: `สถานะการจอง: ${after.status}`,
        message: `การจอง ${context.params.bookingId} เปลี่ยนเป็น ${after.status}`,
        data: { bookingId: context.params.bookingId, from: before.status, to: after.status },
        read: false,
        createdAt: now
      });
    }
  });
