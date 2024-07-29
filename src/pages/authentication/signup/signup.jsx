import "../form.css";
import axios from "axios";
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import GoogleLoginBtn from "../../../components/googleLoginBtn/googleLoginBtn";

export default function Signup() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [image, setImage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Sign Up";

        axios.post("http://localhost:5000/log-in-status", { userData: false }, { withCredentials: true })
            .then((response) => {
                if(response.data.isLoggedIn){
                    navigate("/");
                }
            })
            .catch((err) => {
                console.log(err);
            })
    }, []);

    const handleSignup = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("username", username);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("image", image);

        axios.post("http://localhost:5000/sign-up", formData, {
            withCredentials: true,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })
        .then((response) => {
            if(response.data.message.includes("Success")){
                toast.success(response.data.message);
                navigate("/");
            }else{
                toast.error(response.data.message);
            }
        })
        .catch((err) => {
            console.log(err);
            toast.error("Something Went Wrong!");
        })
    }

    return (
        <section className="main sign-up">
            <form className="main-form">
                <h1 className="logo">Chat App</h1>

                <div className="socials">
                    <GoogleLoginBtn />
                </div>

                <div className="or"></div>

                <label>Username</label>
                <input
                    type="text"
                    name="username"
                    placeholder="Enter username..."
                    autoComplete="off"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <label>Email</label>
                <input
                    type="email"
                    name="email"
                    placeholder="Enter email..."
                    autoComplete="off"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <label>Password</label>
                <input
                    type="password"
                    name="password"
                    placeholder="Enter password..."
                    autoComplete="off"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <label>Image</label>
                <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />

                <button type="submit" onClick={handleSignup}>Sign Up</button>
                <p className="link">Already have an account? <Link to="/log-in">Log In</Link></p>
            </form>
        </section>
    );
}
