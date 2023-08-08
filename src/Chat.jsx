import React, { useContext, useEffect, useRef, useState } from 'react'
import Avatar from './Avatar'
import Logo from './Logo'
import { uniqBy } from "lodash";
import axios from 'axios'
import { UserContext } from './UserContext'
import Contact from './Contact';

const Chat = () => {
    const [ws, setWs] = useState(null)
    const [onlinePeople, setOnlinePeople] = useState({})
    const [selectedUserId, setSelectedUserId] = useState(null)
    const [OfflinePeople, setOfflinePeople] = useState({})
    const { username, id, setId, setUsername } = useContext(UserContext)
    const [newMessageText, setNewMessageText] = useState('')
    const [messages, setMessages] = useState([])
    const divUnderBox = useRef()
    useEffect(() => {
        connectToWs()
    }, [])

    function connectToWs() {
        const ws = new WebSocket('ws://dull-ruby-sheep-veil.cyclic.app')
        setWs(ws)
        ws.addEventListener("message", handleMessage)
        ws.addEventListener("close", () => {
            setTimeout(() => {
                connectToWs()
            }, 1000)
        })
    }
    function showOnlinePeople(peopleArray) {
        const people = {};
        peopleArray.forEach(({ userId, username }) => {
            people[userId] = username
        })
        setOnlinePeople(people)
    }
    function handleMessage(e) {
        const messageData = JSON.parse(e.data)
        if ('online' in messageData) {
            showOnlinePeople(messageData.online)
        } else if ('text' in messageData) {
            // if (messageData.sender === selectedUserId) {   
                setMessages(prve => ([...prve, { ...messageData }]))
            // }
        }
    }
    function sendMessage(ev, file = null) {
        if (ev) ev.preventDefault();
        ws.send(JSON.stringify({
            message: {
                recipent: selectedUserId,
                text: newMessageText,
                file
            }
        }))

        if (file) {
            axios.get("/messages/" + selectedUserId).then((res) => {
                setMessages(res.data)
            })
        } else {
            setNewMessageText('')
            setMessages(prve => ([...prve, {
                sender: id,
                recipent: selectedUserId,
                text: newMessageText,
                isOur: true,
                _id: Date.now()
            }]))
        }
    }
    useEffect(() => {
        const div = divUnderBox.current;
        if (div) {
            div.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
    }, [messages])
    useEffect(() => {
        if (selectedUserId) {
            axios.get("/messages/" + selectedUserId).then((res) => {
                setMessages(res.data)
            })
        }
    }, [selectedUserId])
    const onlinePeopleExcluOurUser = { ...onlinePeople }
    delete onlinePeopleExcluOurUser[id]

    const messagesWithoutDupees = uniqBy(messages, '_id')
    useEffect(() => {
        axios.get("/people").then((res) => {
            const offlinePeopleArr = res.data
                .filter(p => p._id !== id)
                .filter(p => !Object.keys(onlinePeople).includes(p._id))
            const offlinePeople = {};
            offlinePeopleArr.forEach(p => {
                offlinePeople[p._id] = p
            })
            setOfflinePeople(offlinePeople)
        })
    }, [onlinePeople])
    function logout() {
        axios.post('/logout').then((res) => {
            setWs(null)
            setId(null)
            setUsername(null)
        })
    }
    function sendFile(ev) {
        console.log(ev.target.files[0].name);
        const reader = new FileReader()
        reader.readAsDataURL(ev.target.files[0])
        reader.onload = () => {
            sendMessage(null, { name: ev.target.files[0].name, data: reader.result })
        }
    }
    return (
        <div className='flex h-screen'>
            <div className="bg-white w-1/3 flex flex-col">
                <div className='flex-grow'>
                    <Logo />
                    {Object.keys(onlinePeopleExcluOurUser).map(userId => (
                        <Contact
                            key={userId}
                            selected={userId === selectedUserId}
                            id={userId}
                            username={onlinePeopleExcluOurUser[userId]}
                            online={true}
                            onClick={() => setSelectedUserId(userId)}
                        />
                    ))}
                    {Object.keys(OfflinePeople).map(userId => (
                        <Contact
                            key={userId}
                            id={userId}
                            selected={userId === selectedUserId}
                            username={OfflinePeople[userId].username}
                            online={false}
                            onClick={() => setSelectedUserId(userId)}
                        />
                    ))}
                </div>
                <div className='p-2 text-center flex items-center justify-center'>
                    <span className='text-sm mr-2 text-gray-600 flex items-center'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                        </svg>
                        {username}</span>
                    <button
                        onClick={logout}
                        className='text-sm text-gray-500 py-1 px-2 border rounded-sm bg-blue-100'>Logout</button>
                </div>
            </div>
            <div className="flex flex-col bg-blue-100 w-2/3 p-2">
                <div className='flex-grow'>
                    {!selectedUserId && (
                        <div className='flex items-center h-full justify-center'>
                            <div className='text-gray-400'>Select a person from the sidebar</div>
                        </div>
                    )}{!!selectedUserId && (
                        <div className="relative h-full">
                            <div className='overflow-y-scroll absolute top-0 left-0 right-0 bottom-2'>
                                {messagesWithoutDupees.map(message => (
                                    <div key={message._id} className={(message.sender === id ? 'text-right' : 'text-left')}>
                                        <div className={'inline-block p-2 my-2 rounded-md text-sm ' + (message.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500')}>
                                            {message.text}
                                            {message.file && (
                                                <div className='flex items-center gap-1'>
                                                    <a target='_blank' className='flex items-center gap-1 border-b' href={axios.defaults.baseURL + '/uploads/' + message.file}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                                        </svg>
                                                        {message.file}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={divUnderBox}></div>
                            </div>
                        </div>
                    )}
                </div>
                {!!selectedUserId && (
                    <form className='flex gap-2 mx-2' onSubmit={sendMessage}>
                        <input type="text" className='bg-white flex-grow border p-2 rounded-sm' placeholder='Type your message here' value={newMessageText}
                            onChange={ev => setNewMessageText(ev.target.value)} />
                        <label className='bg-blue-200 cursor-pointer p-2 text-gray-600 border border-blue-200 rounded-sm'>
                            <input type="file" className='hidden' onChange={sendFile} />
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                            </svg>
                        </label>
                        <button type='submit' className='bg-blue-500 p-2 text-white rounded-sm'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

export default Chat
