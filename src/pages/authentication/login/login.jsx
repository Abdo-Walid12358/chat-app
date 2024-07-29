import "../form.css";
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleLoginBtn from "../../../components/googleLoginBtn/googleLoginBtn";
import axios from "axios";
import { toast } from "sonner";

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Log In";

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

    const handleLogin = (e) => {
        e.preventDefault();

        axios.post("http://localhost:5000/log-in", { email, password }, { withCredentials: true })
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
    };

    return (
        <section className="main log-in">
            <form className="main-form">
                <h1 className="logo">Chat App</h1>

                <div className="socials">
                    <GoogleLoginBtn />
                </div>

                <div className="or"></div>

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
                <button type="submit" onClick={handleLogin}>Log In</button>
                <p className="link">Don't have an account? <Link to="/sign-up">Sign Up</Link></p>
            </form>
        </section>
    );
}