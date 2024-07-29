import "./error.css";
import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Error(){
    useEffect(() => {
        document.title = "Not Found The Page 404";
    })
    return (
        <div className="not-found-page">
            Not Found The Page 404
            <Link to="/">Back To Home</Link>
        </div>
    )
}