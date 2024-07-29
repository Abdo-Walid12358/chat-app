import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function GoogleLoginBtn(){
    const navigate = useNavigate();

    const handleSuccess = (credentialResponse) => {
        axios.post("http://localhost:5000/auth/google/callback", { token: credentialResponse.credential }, { withCredentials: true })
            .then((response) => {
                if (response.data.message.includes("Success")) {
                    toast.success(response.data.message);
                    navigate("/");
                } else {
                    toast.error(response.data.message);
                }
            })
            .catch((err) => {
                toast.error("Something Went Wrong!");
            });
    }

    const handleError = () => {
        toast.error("Something Went Wrong!");
    }

    return(
        <GoogleOAuthProvider clientId="286400183504-sqg1fpfgd3q7kbhr6u8ff3n9uvdm3p73.apps.googleusercontent.com">
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                theme="filled_blue"
                shape="circle"
            />
        </GoogleOAuthProvider>
    )
}