import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "react-toastify"
import { useSearchUsers } from "@/services/userService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { z } from "zod"
import { useAuth } from "@/hooks/useAuth"
import { useFriends } from "@/services/friendsService"
import { useNavigate } from "react-router-dom"
import { AxiosError } from "axios"
import { Users, Trash, AlertTriangle,UserPlus} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

const searchSchema = z
    .string()
    .min(3, "Search term must be at least 3 characters long")

const FriendsSearch: React.FC = () => {
    const [activeTab, setActiveTab] = useState<"all" | "pending" | "add">("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
    const [friendToRemove, setFriendToRemove] = useState("")
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const {
        useGetFriends,
        useSendFriendRequest,
        useRespondToFriendRequest,
        useRemoveFriend,
        useGetPendingRequests,
    } = useFriends()

    const { data: friends, isLoading: isLoadingFriends } = useGetFriends()
    const { data: pendingRequests, isLoading: isLoadingRequests } =
        useGetPendingRequests()
    const {
        data: searchResults,
        isLoading: isLoadingSearch,
        refetch: refetchSearch,
    } = useSearchUsers(searchTerm, user?.uid)

    const sendFriendRequestMutation = useSendFriendRequest()
    const respondToFriendRequestMutation = useRespondToFriendRequest()
    const removeFriendMutation = useRemoveFriend()

    const handleSearch = () => {
        try {
            searchSchema.parse(searchTerm)
            refetchSearch()
        } catch (error) {
            if (error instanceof z.ZodError) {
                toast.error(error.errors[0].message)
            }
        }
    }

    const handleSendRequest = (friendUserName: string) => {
        if (sent) return; // Prevent sending duplicate requests
        setLoading(true); // Show loading spinner while sending
        sendFriendRequestMutation.mutate(friendUserName, {
            onSuccess: () => {
                setSent(true); // Mark as "Sent"
                toast.success("Friend request sent successfully.")
            },
            onError: (error) => {
                const axiosError = error as AxiosError
                const message: any = axiosError.response?.data
                if (message.message === "Friend request already sent") {
                    toast.warn("Friend request already sent.")
                    return
                }

                toast.error("Failed to send friend request. Please try again.")
            },
            onSettled: () => {
                setLoading(false); // Hide loader after request
            }
        })
    }

    const handleRespondToRequest = (
        requestId: string,
        action: "accept" | "reject"
    ) => {
        respondToFriendRequestMutation.mutate(
            { requestId, action },
            {
                onSuccess: () => {
                    toast.success(`Friend request ${action}ed successfully.`)
                },
                onError: () => {
                    toast.error(
                        `Failed to ${action} friend request. Please try again.`
                    )
                },
            }
        )
    }

    const handleRemoveFriend = () => {
        removeFriendMutation.mutate(friendToRemove, {
            onSuccess: () => {
                toast.success("Friend removed successfully.")
                setIsRemoveDialogOpen(false)
            },
            onError: () => {
                toast.error("Failed to remove friend. Please try again.")
            },
        })
    }

    const handleUserClick = (username: string) => {
        navigate(`/user/${username}`)
    }

    return (
        <div className="min-h-screen pt-[5rem] md:pt[5rem] lg:pt-[5rem] max-h-screen overflow-auto scrollbar-hide text-gray-100 lg:p-4 px-[4rem] w-full">
            <div className="max-w-4xl mx-auto">
                <header className="flex flex-wrap items-center  sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        <h1 className="text-2xl font-bold">Friends</h1>
                    </div>
                    <nav className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="ghost"
                            className={`text-gray-300 rounded-md hover:text-white hover:bg-gray-800 ${activeTab === "all" ? "bg-gray-800" : ""}`}
                            onClick={() => setActiveTab("all")}
                        >
                            All
                        </Button>
                        <Button
                            variant="ghost"
                            className={`text-gray-300 hover:text-white hover:bg-gray-800 ${activeTab === "pending" ? "bg-gray-800" : ""}`}
                            onClick={() => setActiveTab("pending")}
                        >
                            Pending
                        </Button>
                        <Button
                            className={`bg-green-600 hover:bg-green-700 ${activeTab === "add" ? "bg-green-700" : ""}`}
                            onClick={() => setActiveTab("add")}
                        >
                            Add Friend
                        </Button>
                    </nav>
                </header>
                <AnimatePresence mode="wait">
                    {activeTab === "all" && (
                        <motion.section
                            key="all-friends"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h2 className="text-lg font-semibold mb-4">
                                ALL FRIENDS — {friends?.length || 0}
                            </h2>
                            {isLoadingFriends ? (
                                <p>Loading friends...</p>
                            ) : (
                                <ul className="space-y-4">
                                    {friends?.map((friend: string) => (
                                        <motion.li
                                            key={friend}
                                            className="flex items-center justify-between bg-gray-800 p-3 rounded-lg overflow-hidden cursor-pointer transition-colors hover:bg-gray-700"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div
                                                className="flex items-center gap-3 button cursor-pointer"
                                                onClick={() =>
                                                    handleUserClick(friend)
                                                }
                                            >
                                                <Avatar>
                                                    <AvatarImage
                                                        src={`/api/avatar/${friend}`}
                                                        alt={friend}
                                                    />
                                                    <AvatarFallback>
                                                        {friend
                                                            .substring(0, 2)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-semibold">
                                                        {friend}
                                                    </h3>
                                                    <p className="text-sm text-gray-400">
                                                        Online
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="icon"
                                                    onClick={() => {
                                                        setFriendToRemove(
                                                            friend
                                                        )
                                                        setIsRemoveDialogOpen(
                                                            true
                                                        )
                                                    }}
                                                >
                                                    <Trash className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </motion.li>
                                    ))}
                                </ul>
                            )}
                        </motion.section>
                    )}

                    {activeTab === "pending" && (
                        <motion.section
                            key="pending-requests"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h2 className="text-lg font-semibold mb-4">
                                PENDING REQUESTS —{" "}
                                {pendingRequests?.length || 0}
                            </h2>
                            {isLoadingRequests ? (
                                <p>Loading requests...</p>
                            ) : (
                                <ul className="space-y-4">
                                    {pendingRequests.map((request: any) => (
                                        <motion.li
                                            key={request._id}
                                            className="flex items-center justify-between bg-gray-800 p-3 rounded-lg overflow-hidden cursor-pointer transition-colors hover:bg-gray-700"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage
                                                        src={`/api/avatar/${request.from}`}
                                                        alt={request.from}
                                                    />
                                                    <AvatarFallback>
                                                        {request.from
                                                            .substring(0, 2)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-semibold">
                                                        {request.from}
                                                    </h3>
                                                    <p className="text-sm text-gray-400">
                                                        Incoming Request
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-x-2">
                                                <Button
                                                    onClick={() =>
                                                        handleRespondToRequest(
                                                            request._id,
                                                            "accept"
                                                        )
                                                    }
                                                    variant="default"
                                                    size="sm"
                                                >
                                                    Accept
                                                </Button>
                                                <Button
                                                    onClick={() =>
                                                        handleRespondToRequest(
                                                            request._id,
                                                            "reject"
                                                        )
                                                    }
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </motion.li>
                                    ))}
                                </ul>
                            )}
                        </motion.section>
                    )}

                    {activeTab === "add" && (
                        <motion.section
                            key="add-friend"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h2 className="text-lg font-semibold mb-4">
                                ADD FRIEND
                            </h2>
                            <div className="flex space-x-2 mb-4">
                                <Input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="bg-gray-800 border-gray-700 focus:border-gray-600"
                                />
                                <Button onClick={handleSearch}>Search</Button>
                            </div>
                            {isLoadingSearch ? (
                                <p>Searching...</p>
                            ) : (
                                <ul className="space-y-40">
                                    {searchResults?.map((user: any) => (
                                        <motion.li
                                            key={user.uid}
                                            className="flex items-center justify-between bg-gray-800 p-3 rounded-lg overflow-hidden cursor-pointer transition-colors hover:bg-gray-700"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div
                                                className="flex items-center gap-3"
                                                onClick={() =>
                                                    handleUserClick(
                                                        user.userName
                                                    )
                                                }
                                            >
                                                <Avatar>
                                                    <AvatarImage
                                                        src={`/api/avatar/${user.userName}`}
                                                        alt={user.userName}
                                                    />
                                                    <AvatarFallback>
                                                        {user.userName
                                                            .substring(0, 2)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-semibold">
                                                        {user.userName}
                                                    </h3>
                                                    <p className="text-sm text-gray-400">
                                                        User
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                            onClick={() => handleSendRequest(user.userName)}
                                            disabled={loading || sent}
                                            size="sm"
                                            className="p-2 sm:p-2 md:p-4 lg:p-5 rounded-md"
                                            aria-label="Send Friend Request"
                                            >
                                            {/* <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" /> */}
                                            {loading ? "Sending..." : (sent ? "Sent" : "Send Request")}
                                        </Button>
                                        </motion.li>
                                    ))}
                                </ul>
                            )}
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>

            <Dialog
                open={isRemoveDialogOpen}
                onOpenChange={setIsRemoveDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-white" />
                            Remove Friend
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>
                            Are you sure you want to remove this friend? This
                            action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            className="bg-white text-black"
                            onClick={() => setIsRemoveDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleRemoveFriend}>
                            Remove Friend
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default FriendsSearch
