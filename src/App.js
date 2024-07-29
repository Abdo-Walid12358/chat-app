import { Route, Routes } from 'react-router-dom';
import Login from "./pages/authentication/login/login";
import Signup from "./pages/authentication/signup/signup";
import Logout from "./pages/authentication/logout/logout";
import Home from "./pages/home/home";
import Chat from "./pages/chat/chat";
import Page404 from "./pages/error/error";
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/log-in' element={<Login />} />
        <Route path='/sign-up' element={<Signup />} />
        <Route path='/log-out' element={<Logout />} />
        <Route path='/chat/:code' element={<Chat />} />
        <Route path='/*' element={<Page404 />} />
      </Routes>
      <Toaster richColors duration={1427} closeButton />
    </>
  );
}

export default App;