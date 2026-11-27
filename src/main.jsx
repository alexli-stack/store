import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { getLang, prepareLanguage, setLang } from "./i18n.js";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/poppins/900.css";
import "./styles.css";

const render = () => createRoot(document.getElementById("root")).render(<App />);
if (getLang() === "en") render();
else prepareLanguage().catch(() => setLang("en")).then(render);
