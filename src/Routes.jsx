import { useContext } from "react";
import RegisterAndLoginForm from "./RegisterAndLoginForm";
import { UserContext } from "./UserContext";
import Chat from "./Chat";

export default function Route() {
    const { username, id } = useContext(UserContext)
    if (username) {
        return <Chat />
    }
    return (
        <RegisterAndLoginForm />
    )
}