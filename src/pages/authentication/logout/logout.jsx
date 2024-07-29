import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

export default function Logout() {
    const navigate = useNavigate();
    
    useEffect(() => {
        axios.post("http://localhost:5000/log-out", null, { withCredentials: true })
        .then((response) => {
            if(response.data.message === 'Logout Successful'){
                toast.success(response.data.message);
                navigate("/log-in");
            }else{
                toast.error("Something Went Wrong!");
                navigate("/");
            }
        })
        .catch((err) => {
            console.error(err);
            toast.error("Something Went Wrong!");
            navigate("/");
        });
    }, [])

    return null;
}