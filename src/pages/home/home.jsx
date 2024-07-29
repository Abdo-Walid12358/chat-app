import "./home.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import User from "../../components/user/user";
// windows
import Windows from "../../components/windows/windows";
import EditProfile from "../../components/windows/editProfile";

export default function Home(){
    const [user, setUser] = useState({});
    const userCode = useRef(null);
    const [users, setUsers] = useState([]);
    const [isDropdownActive, setIsDropdownActive] = useState(false);
    const navigate = useNavigate();

    const [showEditProfile, setShowEditProfile] = useState(false);
    const [windowClass, setWindowClass] = useState("");

    useEffect(() => {
        document.title = "Home";

        axios.post("http://localhost:5000/log-in-status", { userData: true }, { withCredentials: true })
            .then((response) => {
                if(!response.data.isLoggedIn){
                    navigate("/log-in");
                }else{
                    const userData = response.data.user;
                    setUser(userData);
                    userCode.current = userData.code;
                }
            })
            .catch((err) => {
                console.log(err);
            })

        axios.get("http://localhost:5000/users", { withCredentials: true })
            .then((response) => {
                if(response.data.message === "Success"){
                    const usersData = response.data.users;
                    setUsers(usersData);
                }
            })
            .catch((err) => {
                console.log(err);
            });
        
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, [navigate]);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:5000');

        socket.onmessage = (event) => {
            const newMessage = event.data;
            const newData = JSON.parse(newMessage);

            if(newData.user || newData.userCode){
                if(newData.delete){
                    if(userCode.current == newData.userCode){
                        navigate('/log-out');
                    }else{
                        setUsers(prevUsers => prevUsers.filter(prevUser => prevUser.code !== newData.userCode));
                    }
                }else if(newData.update){
                    setUsers(prevUsers => prevUsers.map(prevUser =>
                        prevUser.code === newData.user.code ? newData.user : prevUser
                    ))
                }else{
                    setUsers(prevUsers => [
                        ...prevUsers,
                        newData.user
                    ])
                }
            }

            if(newData.message && (newData.message.to_user_code === userCode.current)){
                    if(newData.delete){
                        setUsers(prevUsers => prevUsers.map((userElement) => 
                            userElement.code === newData.message.from_user_code
                                ? { ...userElement, unreadCount: userElement.unreadCount - 1 }
                                : userElement
                        ))
                    }else if(!newData.update){
                        setUsers(prevUsers => prevUsers.map((userElement) => 
                            userElement.code === newData.message.from_user_code
                                ? { ...userElement, unreadCount: userElement.unreadCount + 1 }
                                : userElement
                        ));
                    }
                }
        }

        return () => {
            socket.close();
        }
    }, [])

    const toggleDropdownMenu = () => {
        setIsDropdownActive(!isDropdownActive);
    }

    const toggleEditProfile = () => {
        setShowEditProfile(!showEditProfile);
        setWindowClass(showEditProfile ? '' : 'show-edit-profile');
    }

    return (
        <>
            <section className="home">
                <div className="container">
                    <header>
                        <div className="left">
                            <img src={`data:image/jpeg;base64,${user.image}`} alt="" />
                            <span className="username">{user.username}</span>
                        </div>
                        <div className="right">
                            <div className="menu-btn" onClick={toggleDropdownMenu}>
                                <span className="point"></span>
                                <span className="point"></span>
                                <span className="point"></span>
                            </div>
                            <div className={isDropdownActive ? "dropdown-menu active" : "dropdown-menu"} id="dropdownMenu">
                                <button onClick={() => { toggleEditProfile(); toggleDropdownMenu(); }}>Edit Profile</button>
                                <Link to='/log-out' className="logout">Logout</Link>
                            </div>
                        </div>
                    </header>
                    <div className="users">
                        {users.length > 0 ?
                        users.map((user, index) => {
                            return <User
                                key={index}
                                user={user}
                            />
                        }) : <span>Not Found Any User</span>}
                    </div>
                </div>
            </section>
            <Windows className={windowClass}>
                <EditProfile user={user} setUser={setUser} toggleEditProfile={toggleEditProfile} />
            </Windows>
        </>
    );
}