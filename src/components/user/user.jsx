import { useNavigate } from "react-router-dom";
import "./user.css";

export default function User({ user }) {
    const navigate = useNavigate();
    const { username, image, unreadCount, code, lastMessage, lastMessageDate, lastMessageFromUserCode } = user;

    return (
        <div className="user" onClick={() => navigate(`/chat/${btoa(code)}`)}>
            <img
                src={`data:image/jpeg;base64,${image}`}
                alt="User 2"
                className="user-avatar"
            />
            <div className="user-info">
                <div className="user-header">
                    <span className="user-name">{username}</span>
                    <span className="user-last-message-date">{new Date(lastMessageDate).toLocaleDateString()}</span>
                </div>
                <div className="bottom">
                    <span className="user-last-message">{lastMessage ? lastMessageFromUserCode === code ? lastMessage : `You : ${lastMessage}` : "Not Found Any Message"}</span>
                    {unreadCount > 0 && <span className="unread-messages">{unreadCount}</span>}
                </div>
            </div>
        </div>
    );
}
