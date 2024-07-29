import "./message.css";

export default function Message({ isFrom, isTo, messageData }) {
    const { message, audio, date } = messageData;
    
    return (
        <div className={`message ${isFrom ? 'from' : ''} ${isTo ? 'to' : ''}`}>
            {message && <div className="message-content">
                {message}
            </div>}
            {audio && (
                <audio controls>
                    <source src={`data:audio/wav;base64,${messageData.audio}`} type="audio/wav" />
                    Your browser does not support the audio element.
                </audio>
            )}
            <div className="message-timestamp">
                {new Date(date).toLocaleDateString()}
            </div>
        </div>
    );
}