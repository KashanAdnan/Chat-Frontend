import RegisterAndLoginForm from "./RegisterAndLoginForm.jsx"
import axios from 'axios'
import {  UserContextProvider } from "./UserContext.jsx"
import Route from "./Routes"

function App() {
  axios.defaults.baseURL = "https://dull-ruby-sheep-veil.cyclic.app"
  axios.defaults.withCredentials = true
  return (
    <>
      <UserContextProvider>
        <Route/>
      </UserContextProvider>
    </>
  )
}

export default App
