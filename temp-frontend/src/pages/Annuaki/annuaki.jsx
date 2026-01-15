import { useState } from "react";
import { saveDraft, publishArticle, fetchLatestDraft } from "../../util/router";
import { uploadImage } from "../../util/router";
import Navbar from "../../components/Navbar/navbar.jsx"
import "./annuaki.scss";
import him from "./img.png";

export default function Annuaki() {
  const loggedInUser = localStorage.getItem("user");
  if (!loggedInUser) {
    window.location.href = "/login";
  }


  return (
    <div>
        <img className="him" src={him} alt="him"/>
        <footer className="footer">
            You have learned much to be here, alas when much is learned that too must be lost, for the hazard is real and it is coming
        </footer>
    </div>
  );
}
