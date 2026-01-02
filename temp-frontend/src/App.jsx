import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/home.jsx";
import Create from "./pages/Create-Article/create.jsx";
import Login from "./pages/Login/login.jsx";
import Articles from "./pages/View/articles.jsx";
import Edit from "./pages/Create-Article/edit.jsx";
import Users from "./pages/Users/users.jsx";
import UserPage from "./pages/Users/userpage.jsx"


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="create" element={<Create/>}/>
        <Route path="login" element={<Login/>}/>
        <Route path="articles" element={<Articles/>}/>
        <Route path="edit/:id" element={<Edit/>}/>
        <Route path="/users" element={<Users />} />
        <Route path="/users/:username" element={<UserPage />} />
      </Routes>
    </Router>
  );
}
