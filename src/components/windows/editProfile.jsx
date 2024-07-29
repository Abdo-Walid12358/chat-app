import axios from "axios";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export default function EditProfile({ user, setUser, toggleEditProfile }) {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        image: null,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || "",
                email: user.email || "",
                password: "",
                image: null,
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: name === "image" ? files[0] : value,
        }));
    };

    const editProfileHandle = (e) => {
        e.preventDefault();

        axios
            .patch(`http://localhost:5000/user/${btoa(user.token)}`, formData, {
                withCredentials: true,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            .then((response) => {
                if (response.data.message.includes("Success")) {
                    toast.success("Profile updated successfully!");
                    toggleEditProfile();
                    setUser((prevUser) => ({
                        ...prevUser,
                        username: formData.username,
                        image: response.data.blob === null ? prevUser.image : response.data.blob
                    }));
                    setFormData((prevData) => ({
                        ...prevData,
                        password: "",
                    }));
                } else {
                    toast.error(response.data.message);
                }
            })
            .catch((err) => {
                console.error(err);
                toast.error("Something went wrong!");
            });
    };

    return (
        <div className="window edit-profile">
            <form encType="multipart/form-data">
                <i
                    className="fa-solid fa-xmark close-my"
                    onClick={toggleEditProfile}
                ></i>
                <h1 className="logo">Edit Profile</h1>

                <label>Username</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Enter Username . . ."
                    value={formData.username}
                    autoComplete="off"
                    required
                    onChange={handleChange}
                />

                <label>Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter Email . . ."
                    value={formData.email}
                    autoComplete="off"
                    required
                    disabled
                />

                <label>Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Enter A New Password"
                    autoComplete="off"
                    required
                    onChange={handleChange}
                />

                <label>Image</label>
                <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                />

                <button className="main-btn" onClick={editProfileHandle}>
                    Save
                </button>
            </form>
        </div>
    );
}
