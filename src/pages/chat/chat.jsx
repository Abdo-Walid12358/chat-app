import "./chat.css";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Page404 from "../error/error";
import Message from "../../components/message/message";
import { toast } from "sonner";
import EmojiPicker from "emoji-picker-react";
import Peer from 'peerjs';

export default function Chat() {
    const { code } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState({});
    const clientCode = useRef('');
    const [user, setUser] = useState({});
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [emojiPickerClass, setEmojiPickerClass] = useState('');
    const [error, setError] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        document.title = "Chat";

        axios.post("http://localhost:5000/log-in-status", { userData: true }, { withCredentials: true })
            .then((response) => {
                if (!response.data.isLoggedIn) {
                    navigate("/log-in");
                } else {
                    const clientData = response.data.user;
                    setClient(clientData);
                    clientCode.current = clientData.code;
                }
            })
            .catch((err) => {
                console.log(err);
                setError(true);
            });

        axios.get(`http://localhost:5000/user/${code}`)
            .then((response) => {
                if (response.data.message === "Success") {
                    setUser(response.data.user);
                } else {
                    setError(true);
                }
            })
            .catch((err) => {
                console.log(err);
                setError(true);
            });
    }, [navigate]);

    useEffect(() => {
        if (client?.code) {
            axios.post(`http://localhost:5000/user/${code}/messages`, { fromUserCode: client.code })
                .then((response) => {
                    if (response.data.message === "Success") {
                        setMessages(response.data.messages);
                    }
                })
                .catch((err) => {
                    console.log(err);
                    setError(true);
                });

            axios.post(`http://localhost:5000/user/${client.code}/messages/read`, { fromUserCode: atob(code) })
                .catch(err => {
                    console.error("Failed to mark messages as read:", err);
                });
        }
    }, [client, code]);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:5000');

        socket.onmessage = (event) => {
            const newMessage = event.data;
            const newData = JSON.parse(newMessage);

            if (newData.user || newData.userCode) {
                if (newData.delete) {
                    if (clientCode.current === newData.userCode) {
                        navigate('/log-out');
                    }
                    if (atob(code) === newData.userCode) {
                        setError(true);
                    }
                } else if (newData.update) {
                    if (atob(code) === newData.user.code) {
                        setUser(newData.user);
                    }
                }
            }

            if (newData.message &&
                ((newData.message.from_user_code === clientCode.current && newData.message.to_user_code === atob(code)) ||
                    (newData.message.from_user_code === atob(code) && newData.message.to_user_code === clientCode.current))) {

                if (newData.delete) {
                    setMessages(prevMessages => prevMessages.filter((messageElement) => messageElement.token !== newData.message.token));
                } else if (newData.update) {
                    setMessages(prevMessages => prevMessages.map(messageElement =>
                        messageElement.token === newData.message.token ? newData.message : messageElement
                    ));
                } else {
                    setMessages(prevMessages => [
                        ...prevMessages,
                        newData.message
                    ]);

                    axios.post(`http://localhost:5000/user/${clientCode.current}/messages/read`, { fromUserCode: atob(code) })
                        .catch(err => {
                            console.error("Failed to mark messages as read:", err);
                        });
                }
            }
        };

        return () => {
            socket.close();
        };
    }, [client, code]);

    if (error) {
        return <Page404 />;
    }

    const sendMessageHandle = () => {
        const formData = new FormData();
        formData.append('message', message);
        formData.append('fromUserCode', client.code);
        if (audioBlob) {
            formData.append('audio', audioBlob, 'recording.wav');
        }

        axios.post(`http://localhost:5000/user/${code}/message`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        })
            .then((response) => {
                if (response.data.message !== "Success") {
                    toast.error(response.data.message);
                } else {
                    setMessage('');
                    setAudioBlob(null); // Reset audio blob
                    emojiPickerClass && toggleEmojiPicker();
                }
            })
            .catch((err) => {
                console.log(err);
                toast.error("Something Went Wrong!");
            });
    };

    const onEmojiClickHandle = (e) => {
        setMessage(prevMessage => prevMessage + e.emoji);
    };

    const toggleEmojiPicker = () => {
        setEmojiPickerClass(emojiPickerClass ? "" : "active");
    };

    const startRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    mediaRecorderRef.current = new MediaRecorder(stream);
                    mediaRecorderRef.current.ondataavailable = (event) => {
                        audioChunksRef.current.push(event.data);
                    };
                    mediaRecorderRef.current.onstop = () => {
                        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                        setAudioBlob(audioBlob);
                        audioChunksRef.current = [];
                        // Optionally, play back the recording
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        //audio.play();
                    };
                    mediaRecorderRef.current.start();
                    setIsRecording(true);
                })
                .catch(error => {
                    console.error("Error accessing microphone:", error);
                    toast.error("Unable to access microphone.");
                });
        }
    };
    
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <>
            <section className="chat">
                <div className="container">
                    <header>
                        <div className="left">
                            <Link to="/"><i className="fa-solid fa-arrow-left"></i></Link>
                            <img src={`data:image/jpeg;base64,${user.image}`} alt="" />
                            <span className="username">{user.username}</span>
                        </div>
                        <div className="right">
                            {/* <i className="fa-solid fa-phone" onClick={startCall}></i> */}
                        </div>
                    </header>
                    <div className="chat-box">
                        {messages.length > 0 ? messages.map((message, index) => {
                            const isFrom = message.from_user_code === client.code;
                            const isTo = message.to_user_code === client.code;
                            return (
                                <Message
                                    key={index}
                                    isFrom={isFrom}
                                    isTo={isTo}
                                    messageData={message}
                                />
                            );
                        }) : <span>Not Found Any Messages With This User</span>}
                    </div>
                    <div className="bottom">
                        <textarea type="text" placeholder="send a message" value={message} onChange={(e) => setMessage(e.target.value)} />
                        {!isRecording && <i className="fa-solid fa-microphone" onClick={startRecording}></i>}
                        {isRecording && <i className="fa-solid fa-microphone-slash" onClick={stopRecording}></i>}
                        <i className="fa-solid fa-face-smile" onClick={toggleEmojiPicker}></i>
                        <i className="fa-solid fa-paper-plane" onClick={sendMessageHandle}></i>
                    </div>
                    <EmojiPicker className={emojiPickerClass} width={320} height={420} lazyLoadEmojis onEmojiClick={onEmojiClickHandle} emojiStyle="apple" />
                </div>
            </section>
        </>
    );
}