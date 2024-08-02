import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'tailwindcss/tailwind.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./DropdownMenu.jsx";
import './OrderPage.css';
import { GoPackageDependents } from "react-icons/go";
import { FaPenToSquare, FaRegCircleCheck } from "react-icons/fa6";
import { MdOutlineCancel } from "react-icons/md";
import { AiOutlineExclamationCircle } from "react-icons/ai";
import { RiRefund2Line } from "react-icons/ri";
import Background from '../../../assets/bg1.png';
import ModifyPage from './ModifyPage'; // Import the ModifyPage component

export default function OrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [orders, setOrders] = useState([]);
  const [username, setUsername] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [cancelOption, setCancelOption] = useState('');
  const [itemsToSelect, setItemsToSelect] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true); // New loading state

  useEffect(() => {
    const fetchOrders = async () => {
      if (!email) {
        console.log('No user email available');
        return;
      }
      try {
        console.log(`Fetching orders for email: ${email}`);
        const response = await axios.get(`http://localhost:5000/api/orders?email=${email}`);
        setOrders(response.data);
        console.log('Orders fetched:', response.data);

        if (response.data.length > 0) {
          setUsername(response.data[0]["Billing Address Name"]);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
    
    // Set loading to false after 5 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timer); // Cleanup the timer on component unmount
  }, [email]);

  // if (loading) {
  //   return (
  //     <div class="container">
  //       <img src="src/assets/sleep.png" alt="Sleeping Cat" class="cat-bed"/>
  //       <div class="zzz cat-bed">z</div>
  //       {/* <!-- <div class="zzz">z</div>
  //       <div class="zzz">z</div> -->
  //       <!-- <div class="zzz" style="top: -50px; left: 55%;">zzz</div>
  //       <div class="zzz" style="top: -70px; left: 60%;">zzz</div> --> */}
  //   </div>
  //   );
  // }

  // The rest of your code remains unchanged...
  const groupedOrders = orders.reduce((acc, order) => {
    const displayOrderCode = order["Display Order Code"];
    if (!acc[displayOrderCode]) {
      acc[displayOrderCode] = {};
    }
    const itemTypeName = order["Item Type Name"];
    if (!acc[displayOrderCode][itemTypeName]) {
      acc[displayOrderCode][itemTypeName] = [];
    }
    acc[displayOrderCode][itemTypeName].push(order);
    return acc;
  }, {});

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-600";
      case "pending_verification":
        return "bg-yellow-100 text-yellow-600";
      case "dispatched":
        return "bg-blue-100 text-blue-600";
      case "cancelled":
        return "bg-red-100 text-red-600";
      case "processing":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getBorderClass = (orders) => {
    const hasPending = Object.values(orders).flat().some(order => order["Sale Order Item Status"].toLowerCase() === 'created');
    return hasPending ? 'border border-red-900' : '';
  };

  const hasPendingActions = (orders) => {
    return Object.values(orders).flat().some(order => order["Sale Order Item Status"].toLowerCase() === 'created');
  };

  const handleDropdownChange = (e, displayOrderCode) => {
    const value = e.target.value;
    if (value === 'cancel') {
      setCurrentOrder(displayOrderCode);
      setShowDialog(true);
    } else if (value === 'confirm') {
      setCurrentOrder(displayOrderCode);
      setShowConfirmDialog(true);
    } else if (value === 'modify') {
      setCurrentOrder(displayOrderCode);
      setShowModifyDialog(true);
    }
  };

  const handleToggleExpand = (displayOrderCode) => {
    setExpandedOrders(prevState => ({
      ...prevState,
      [displayOrderCode]: !prevState[displayOrderCode],
    }));
  };

  const handleCancelOptionChange = async (e) => {
    const value = e.target.value;
    setCancelOption(value);

    if (value === 'select-item' && currentOrder) {
      const orderItems = Object.values(groupedOrders[currentOrder]).flat();
      setItemsToSelect(orderItems);
      setSelectedItems([]);
    } else {
      setItemsToSelect([]);
    }
  };

  const handleItemChange = (e) => {
    const value = e.target.value;
    setSelectedItems(prevItems => {
      if (prevItems.includes(value)) {
        return prevItems.filter(item => item !== value);
      } else {
        return [...prevItems, value];
      }
    });
  };

  const handleConfirmOrder = () => {
    alert('Your verification is in process.');
    setShowConfirmDialog(false);
    updateRecentActivity(`Confirmed order ${currentOrder}`);
  };

  const updateRecentActivity = (activity) => {
    setRecentActivity((prev) => [activity, ...prev]);
  };

  const handleConfirm = () => {
    if (selectedReason.trim() === '' || (selectedReason === 'Other' && reason.trim() === '')) {
      alert('Reason for cancellation is required.');
      return;
    }

    const orderItems = Object.values(groupedOrders[currentOrder]).flat();
    const selectedOrderItems = orderItems.filter(item => selectedItems.includes(item["Sale Order Item Code"]));
    const hasOnHoldItems = selectedOrderItems.some(item => item["On Hold"]);

    if (hasOnHoldItems) {
      alert('Sorry, we cannot cancel the selected items as one or more are currently on hold.');
      setShowDialog(false);
      return;
    }

    console.log(`Cancelling order ${currentOrder} for items ${selectedItems} with reason: ${selectedReason}${selectedReason === 'Other' ? `: ${reason}` : ''}`);
    setShowDialog(false);
    updateRecentActivity(`Cancelled items in order ${currentOrder}`);
  };

  const handleClose = () => {
    setShowDialog(false);
    setReason('');
    setSelectedItems([]);
    setCancelOption('');
    setItemsToSelect([]);
    setSelectedReason('');
  };

  const renderOrderGroup = (orderGroup, displayOrderCode) => {
    const isExpanded = expandedOrders[displayOrderCode] || false;

    const allDelivered = Object.values(orderGroup).flat().every(item => item["Sale Order Item Status"].toLowerCase() === 'delivered');

    const allCancelled = Object.values(orderGroup).flat().every(item => item["Sale Order Item Status"].toLowerCase() === 'cancelled');

    const hasPendingItems = Object.values(orderGroup).flat().some(item => item["Sale Order Item Status"].toLowerCase() === 'created');

    return (
      <div key={displayOrderCode} className={`relative mb-16 bg-white rounded-lg shadow-md overflow-hidden ${getBorderClass(orderGroup)} mb-8 p-4 sm:p-6 lg:p-8`}>
        <div className="px-4 py-2 sm:px-6 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8">
            <div className="text-center sm:text-left text-xl sm:text-2xl lg:text-3xl font-bold sm:ml-7">Order ID: {displayOrderCode}</div>
            <div className="flex items-center mt-2 sm:mt-0 ">
              {hasPendingActions(orderGroup) && (
                <span className="inline-block bg-red-600 text-white rounded-full px-2 py-1 text-xs sm:text-sm lg:text-base font-semibold mr-2">
                  Pending Actions!
                </span>
              )}
              <div className="text-sm sm:text-base lg:text-lg text-gray-500">
                {Object.values(orderGroup)[0][0]["Order Date as dd/mm/yyyy hh:MM:ss"]}
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {Object.entries(orderGroup).map(([itemTypeName, items]) => (
              <div key={itemTypeName} className="sm:ml-5">
                {items.map(item => {
                  const status = ["created", "fulfillable", "unfulfillable", "packed"].includes(item["Sale Order Item Status"].toLowerCase())
                    ? item["Sale Order Status"]
                    : item["Sale Order Item Status"];

                  const [mainName, type, dimension] = itemTypeName.split('_');

                  return (
                    <div key={item["Sale Order Item Code"]} style={{marginBottom:50}} className="flex flex-col sm:flex-row justify-between items-center mt-2">
                      <div className="w-full sm:w-1/2 text-gray-700 px-2 py-1">
                        <h5 className="text text-lg sm:text-xl lg:text-2xl text-blue-800 font-bold">{mainName.replace(/_/g, ' ')}</h5>
                        <div className="text-sm sm:text-base lg:text-lg pt-2">
                          <p>Size: {type && type.replace(/_/g, ' ')}</p>
                          <p>Dimensions: {dimension && dimension.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                      <div className="w-full sm:w-1/4 text-right text-gray-700">₹{item["Selling Price"].toFixed(2)}</div>
                      <div className={`inline-block px-3 py-1 rounded-full font-medium ${getStatusStyle(status)}`}>
                        {status}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {isExpanded && (
            <div className="bg-gray-100 px-4 py-2 sm:px-6 sm:py-4 flex flex-col sm:flex-row justify-between items-center">
              <div className="w-full sm:w-1/2">
                <div className="text-sm sm:text-base lg:text-lg text-gray-500 mb-2">
                  Shipping Address: {`${Object.values(orderGroup)[0][0]["Shipping Address Line 1"]}, ${Object.values(orderGroup)[0][0]["Shipping Address Line 2"]}, ${Object.values(orderGroup)[0][0]["Shipping Address City"]}, ${Object.values(orderGroup)[0][0]["Shipping Address State"]}, ${Object.values(orderGroup)[0][0]["Shipping Address Country"]} - ${Object.values(orderGroup)[0][0]["Shipping Address Pincode"]}`}
                </div>
                <div className="text-sm sm:text-base lg:text-lg text-gray-500">Shipping Phone: {Object.values(orderGroup)[0][0]["Shipping Address Phone"]}</div>
                {Object.values(orderGroup)[0][0]["COD"] === 1 && (
                  <div className="text-sm sm:text-base lg:text-lg text-gray-500 mt-2">
                    COD Service Charges: ₹{Object.values(orderGroup).flat().reduce((total, item) => total + item["COD Service Charges"], 0).toFixed(2)}
                  </div>
                )}
                <div className="text-sm sm:text-base lg:text-lg mt-2">
                  Total Amount: ₹{Object.values(orderGroup).flat().reduce((total, item) => total + item["Total Price"], 0).toFixed(2)}
                </div>
              </div>
              <div className="mt-4 sm:mt-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition duration-150 ease-in-out">
                      Manage this Order
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-base sm:text-lg lg:text-xl px-4 py-2" disabled={allCancelled || allDelivered} onClick={() => handleDropdownChange({ target: { value: 'modify' } }, displayOrderCode)}>
                      <FaPenToSquare />&nbsp; Modify Order
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-base sm:text-lg lg:text-xl px-4 py-2" disabled={allCancelled}><GoPackageDependents />&nbsp; Return & Exchange</DropdownMenuItem>
                    <DropdownMenuItem className="text-base sm:text-lg lg:text-xl px-4 py-2" disabled={allCancelled}><RiRefund2Line />&nbsp; Return & Refund</DropdownMenuItem>
                    <DropdownMenuItem className="text-base sm:text-lg lg:text-xl px-4 py-2" disabled={!hasPendingItems || allCancelled || allDelivered} onClick={() => handleDropdownChange({ target: { value: 'confirm' } }, displayOrderCode)}>
                      <FaRegCircleCheck />&nbsp; Confirm Order
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-base sm:text-lg lg:text-xl px-4 py-2" disabled={allCancelled || allDelivered} onClick={() => handleDropdownChange({ target: { value: 'cancel' } }, displayOrderCode)}>
                      <MdOutlineCancel />&nbsp; Cancel Order
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-base sm:text-lg lg:text-xl px-4 py-2"><AiOutlineExclamationCircle />&nbsp; Escalate an Issue</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 mt-4">
          <div className="cursor-pointer mt-4" onClick={() => handleToggleExpand(displayOrderCode)}>
            <img
              width="30px"
              src={isExpanded ? 'https://cdn-icons-png.flaticon.com/128/10513/10513312.png' : 'https://cdn-icons-png.flaticon.com/128/10513/10513302.png'}
              alt='Expand/Collapse'
            />
          </div>
        </div>
      </div>
    );
  };

  const renderPendingActions = () => {
    const pendingOrders = orders.filter(order =>
      order["Sale Order Item Status"].toLowerCase() === 'created'
    );

    if (pendingOrders.length === 0) {
      return <p style={{marginBottom:50}}>No pending actions at the moment.</p>;
    }

    return pendingOrders.map((order) => renderOrderGroup({ [order["Item Type Name"]]: [order] }, order["Display Order Code"]));
  };

  const renderRecentActivity = () => {
    if (recentActivity.length === 0) {
      return <p>No recent activities at the moment.</p>;
    }

    return (
      <ul>
        {recentActivity.map((activity, index) => (
          <li key={index} className="text-sm sm:text-base lg:text-lg text-gray-700">{activity}</li>
        ))}
      </ul>
    );
  };

  const renderCancelDialog = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div className="bg-white p-8 rounded-lg shadow-2lg w-4/5 sm:w-2/3 lg:w-1/2">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4">Cancel Order</h2>
          <div className="mb-4">
            <label className="block text-sm sm:text-base lg:text-lg font-medium text-gray-700 mb-2">
              Cancellation Option
            </label>
            <div className="mt-4 sm:mt-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition duration-150 ease-in-out">
                    {cancelOption === "" ? "Select an option" : cancelOption === "select-item" ? "Select Individual Items" : "All Orders"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-base sm:text-lg lg:text-xl" onClick={() => handleCancelOptionChange({ target: { value: 'select-item' } })}>
                    Select Individual Items
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-base sm:text-lg lg:text-xl" onClick={() => handleCancelOptionChange({ target: { value: 'all' } })}>
                    All Orders
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {cancelOption === 'select-item' && itemsToSelect.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm sm:text-base lg:text-lg font-medium text-gray-700 mb-2">
                Select Items to Cancel
              </label>
              {itemsToSelect.map((item) => (
                <div key={item["Sale Order Item Code"]} className="form-check mb-2" style={{ fontSize: '1rem' }}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={item["Sale Order Item Code"]}
                    value={item["Sale Order Item Code"]}
                    onChange={handleItemChange}
                    checked={selectedItems.includes(item["Sale Order Item Code"])}
                    disabled={item["Sale Order Item Status"].toLowerCase() === 'delivered'}
                    style={{
                      width: '1.5em',  // Adjust the width as needed
                      height: '1.5em', // Adjust the height as needed
                      accentColor: '#007bff', // Change color of the checkbox when checked (modern browsers)
                      cursor: item["Sale Order Item Status"].toLowerCase() === 'delivered' ? 'not-allowed' : 'pointer' // Optional: Add a pointer cursor
                    }}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={item["Sale Order Item Code"]}
                    style={{
                      fontSize: '1.2rem', // Adjust font size of the label text
                      marginLeft: '0.5em', // Optional: Add spacing between checkbox and label
                      color: item["Sale Order Item Status"].toLowerCase() === 'delivered' ? 'gray' : 'black'
                    }}
                  >
                    {item["Item Type Name"].replace(/_/g, ' ')}
                  </label>
                </div>
              ))}
            </div>
          )}
          {(cancelOption === 'all' || cancelOption === 'select-item') && (
            <>
              <div className="mb-4">
                <label className="block text-sm sm:text-base lg:text-lg font-medium text-gray-700 mb-2">
                  Select Reason for Cancellation
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Select a reason</option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Found a better price elsewhere">Delay in Dispatch</option>
                  <option value="Item not needed anymore">Delay in Delivery</option>
                  <option value="Order delayed">Discount code not applied</option>
                  <option value="better deal">Found a better deal somewhere else</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm sm:text-base lg:text-lg font-medium text-gray-700 mb-2">
                  Reason for Cancellation (max 100 characters)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={100}
                  required
                  className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg mr-2"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmDialog = () => {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div className="bg-white p-8 rounded-lg shadow-2lg w-4/5 sm:w-2/3 lg:w-1/2">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4">Confirm Order</h2>
          <p className="text-sm sm:text-base lg:text-lg mb-4">Do you want to confirm the order?</p>
          <div className="flex justify-end">
            <button
              onClick={() => setShowConfirmDialog(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg mr-2"
            >
              No
            </button>
            <button
              onClick={handleConfirmOrder}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    navigate('/login'); // Navigate to the login page
  };

  return (
    <div style={{ backgroundImage: "url(" + Background + ")" }} className="order-page">
      <header className="w-full bg-FLOBlue py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex-shrink-0">
            <img src="src/assets/flomattresses_web.jpg" alt="Flomattresses Logo" className="w-16 sm:w-20 lg:w-24 h-auto mt-2 mb-2" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white">FLOBRIDGE</div>
          <div className="navbar-right flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="bg-transparent text-base sm:text-lg lg:text-xl text-white border border-white px-4 py-2 rounded-full hover:bg-blue-600 hover:border-white transition duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <div className="container mx-auto p-4">
        <div className="p-4 mb-8">
          <h1 style={{ marginLeft: -13 }} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-2">Welcome {username}!</h1>
        </div>
        <div>
          <h2 className="text-2xl sm:text-5xl lg:text-4xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Pending Actions</h2>
          {renderPendingActions()}
        </div>

        <div>
          <h2 className="text-2xl sm:text-5xl lg:text-4xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Your Orders</h2>
          {Object.entries(groupedOrders).map(([displayOrderCode, orderGroup]) => renderOrderGroup(orderGroup, displayOrderCode))}
        </div>

        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Recent Activity</h2>
          {renderRecentActivity()}
        </div>
        {showDialog && renderCancelDialog()}
        {showConfirmDialog && renderConfirmDialog()}
        {showModifyDialog && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-2lg w-4/5 sm:w-2/3 lg:w-1/2">
              <ModifyPage order={groupedOrders[currentOrder]} onClose={() => setShowModifyDialog(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
