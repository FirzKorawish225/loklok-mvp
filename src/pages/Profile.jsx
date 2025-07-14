import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db, auth } from "../firebase";
import {
  doc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { updatePassword, updateEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { reauthenticateUser } from "../utils/reauthenticate";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    address: "",
    role: "seller",
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // redirect ถ้ายังไม่ได้ login
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // ดึงข้อมูลผู้ใช้จาก Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setFormData({
            email: user.email || "",
            name: userData.name || "",
            phone: userData.phone || "",
            address: userData.address || "",
            role: userData.role || "seller",
          });
        } else {
          setFormData((prev) => ({
            ...prev,
            email: user.email || "",
          }));
        }
      }
    };
    fetchUserData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      // เปลี่ยนอีเมล (เฉพาะถ้ามีการเปลี่ยน)
      if (formData.email !== user.email) {
        await reauthenticateUser(auth.currentUser, currentPassword);
        await updateEmail(auth.currentUser, formData.email);
      }

      // บันทึกข้อมูลอื่นลง Firestore
      const { email, ...profileData } = formData;
      await setDoc(doc(db, "users", user.uid), profileData, { merge: true });

      alert("บันทึกข้อมูลสำเร็จ ✅");
    } catch (err) {
      console.error(err);
      alert("บันทึกข้อมูลไม่สำเร็จ ❌\n" + err.message);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      return alert("กรุณากรอกรหัสผ่านเดิมและใหม่ให้ครบ");
    }

    try {
      await reauthenticateUser(auth.currentUser, currentPassword);
      await updatePassword(auth.currentUser, newPassword);
      alert("เปลี่ยนรหัสผ่านสำเร็จ ✅");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถเปลี่ยนรหัสผ่านได้ ❌\n" + err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">แก้ไขข้อมูลผู้ใช้งาน</h2>

      <div className="space-y-3">
        <input
          className="border p-2 w-full"
          name="email"
          type="email"
          placeholder="อีเมล"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          className="border p-2 w-full"
          name="name"
          placeholder="ชื่อ"
          value={formData.name}
          onChange={handleChange}
        />
        <input
          className="border p-2 w-full"
          name="phone"
          placeholder="เบอร์โทร"
          value={formData.phone}
          onChange={handleChange}
        />
        <input
          className="border p-2 w-full"
          name="address"
          placeholder="ที่อยู่"
          value={formData.address}
          onChange={handleChange}
        />
        <div>
          <label>บทบาท (role): </label>
          <select
            name="role"
            className="border p-2"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="seller">Seller</option>
            <option value="admin">Market Owner</option>
          </select>
        </div>

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={handleSave}
        >
          บันทึกข้อมูล
        </button>
      </div>

      <div className="mt-6 border-t pt-4">
        <h3 className="font-semibold">เปลี่ยนรหัสผ่าน</h3>
        <input
          type="password"
          className="border p-2 w-full mt-2"
          placeholder="รหัสผ่านเดิม"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <input
          type="password"
          className="border p-2 w-full mt-2"
          placeholder="รหัสผ่านใหม่"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          onClick={handleChangePassword}
        >
          เปลี่ยนรหัสผ่าน
        </button>
      </div>
    </div>
  );
};

export default Profile;
