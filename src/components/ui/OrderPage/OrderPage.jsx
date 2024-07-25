import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'tailwindcss/tailwind.css';
import { useLocation } from 'react-router-dom';
import './OrderPage.css';

export default function OrderPage() {
  const location = useLocation();
  const email = location.state?.email;
  const [orders, setOrders] = useState([]);
  const [username, setUsername] = useState('');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [itemsOptions, setItemsOptions] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');

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
  }, [email]);

  useEffect(() => {
    if (currentOrder) {
      const orderGroup = orders.filter(order => order["Display Order Code"] === currentOrder);
      if (orderGroup.length > 1) {
        const items = orderGroup.flatMap(order => order["Item Type Name"]);
        setItemsOptions([...new Set(items)]);
      } else {
        setItemsOptions([]);
      }
    }
  }, [currentOrder, orders]);

  const groupedOrders = orders.reduce((acc, order) => {
    const displayOrderCode = order["Display Order Code"];
    if (!acc[displayOrderCode]) {
      acc[displayOrderCode] = [];
    }
    acc[displayOrderCode].push(order);
    return acc;
  }, {});

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-600";
      case "pending":
        return "bg-yellow-100 text-yellow-600";
      case "dispatched":
        return "bg-blue-100 text-blue-600";
      case "cancelled":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getBorderClass = (orders) => {
    const hasPending = orders.some(order => order["Sale Order Item Status"].toLowerCase() === 'pending');
    return hasPending ? 'border border-red-600' : '';
  };

  const hasPendingActions = (orders) => {
    return orders.some(order => order["Sale Order Item Status"].toLowerCase() === 'pending');
  };

  const handleDropdownChange = (e, displayOrderCode) => {
    const value = e.target.value;
    if (value === 'cancel') {
      setCurrentOrder(displayOrderCode);
      setShowDialog(true);
    }
  };

  const handleToggleExpand = (displayOrderCode) => {
    setExpandedOrders(prevState => ({
      ...prevState,
      [displayOrderCode]: !prevState[displayOrderCode],
    }));
  };

  const handleReasonChange = (e) => {
    setReason(e.target.value);
  };

  const handleItemChange = (e) => {
    setSelectedItem(e.target.value);
  };

  const handleConfirm = () => {
    // Implement the cancel order logic here using `currentOrder`, `reason`, and `selectedItem`
    console.log(`Cancelling order ${currentOrder} for item ${selectedItem} with reason: ${reason}`);
    setShowDialog(false);
  };

  const handleClose = () => {
    setShowDialog(false);
    setReason('');
    setSelectedItem('');
  };

  const renderOrderGroup = (orderGroup, displayOrderCode) => {
    const order = orderGroup[0];
    const isExpanded = expandedOrders[displayOrderCode] || false;
    const isCOD = order["COD"] === 1; // Assuming 1 indicates COD

    return (
      <div key={displayOrderCode} className={`relative bg-white rounded-lg shadow-md overflow-hidden ${getBorderClass(orderGroup)} mb-8 p-8`}>
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-8">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">{displayOrderCode}</div>
            <div className="flex items-center">
              {hasPendingActions(orderGroup) && (
                <span className="inline-block bg-red-600 text-white rounded-full px-2 py-1 text-xs sm:text-sm lg:text-base font-semibold mr-2">
                  Pending Actions!
                </span>
              )}
              <div className="text-sm sm:text-base lg:text-lg text-gray-500">{order["Order Date as dd/mm/yyyy hh:MM:ss"]}</div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {orderGroup.map((item) => (
              <div key={item["Sale Order Item Code"]} className="flex justify-between items-center">
                <div className="w-1/2 text-sm sm:text-base lg:text-lg text-gray-700 px-2 py-1">{item["Item Type Name"]}</div>
                <div className="w-1/4 text-sm sm:text-base lg:text-lg text-right text-gray-700">₹{item["Selling Price"].toFixed(2)}</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm sm:text-base lg:text-lg font-medium ${getStatusStyle(item["Sale Order Item Status"])}`}>
                  {item["Sale Order Item Status"]}
                </div>
              </div>
            ))}
          </div>

          {isExpanded && (
            <div className="bg-gray-100 px-6 py-4 flex justify-between items-center">
              <div className="w-1/2">
                <div className="text-sm sm:text-base lg:text-lg text-gray-500 mb-2">
                  Shipping Address: {`${order["Shipping Address Line 1"]}, ${order["Shipping Address Line 2"]}, ${order["Shipping Address City"]}, ${order["Shipping Address State"]}, ${order["Shipping Address Country"]} - ${order["Shipping Address Pincode"]}`}
                </div>
                <div className="text-sm sm:text-base lg:text-lg text-gray-500">Shipping Phone: {order["Shipping Address Phone"]}</div>
                {isCOD && (
                  <>
                    <div className="text-sm sm:text-base lg:text-lg text-gray-500 mt-2">
                      COD Service Charges: ₹{order["COD Service Charges"].toFixed(2)}
                    </div>
                  </>
                )}
                <div className="text-sm sm:text-base lg:text-lg text-gray-500 mt-2">
                  Total Amount: ₹{orderGroup.reduce((total, item) => total + item["Total Price"], 0).toFixed(2)}
                </div>
              </div>
              <div>
                <select
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm sm:text-base lg:text-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition duration-150 ease-in-out"
                  defaultValue="manage"
                  onChange={(e) => handleDropdownChange(e, displayOrderCode)}
                >
                  <option value="manage" disabled hidden>Manage Orders</option>
                  <option value="modify">Modify Order</option>
                  <option value="modify-details">Modify Details</option>
                  <option value="return">Return Order</option>
                  <option value="cancel">Cancel Order</option>
                  <option value="complaint">Complaint</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex justify-center">
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

  const pendingOrders = orders.filter(order => order["Sale Order Item Status"].toLowerCase() === 'pending');
  const recentActivityOrders = [];

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="w-full bg-FLOBlue py-0">
        <div className="container mx-auto px-4 sm:px-4 lg:px-8 flex justify-between items-center">
          <div className="flex-shrink-0">
            <img src="src/assets/flomattresses_web.jpg" alt="Flomattresses Logo" className="w-16 sm:w-20 lg:w-24 h-auto" />
          </div>
          <div className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white">FLOBRIDGE</div>
          <div className="mr-2">
            <button className="text-white hover:text-gray-300">Logout</button>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 sm:px-4 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-8">Welcome {username}</h1>

        <div className="space-y-16">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Pending Actions</h2>
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order) => renderOrderGroup([order], order["Display Order Code"]))
            ) : (
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">No pending actions at the moment.</p>
            )}
          </div>

          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Your Orders</h2>
            {Object.entries(groupedOrders).map(([displayOrderCode, orderGroup]) => renderOrderGroup(orderGroup, displayOrderCode))}
          </div>

          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-500 pb-2">Recent Activity</h2>
            {recentActivityOrders.length > 0 ? (
              recentActivityOrders.map((order) => renderOrderGroup([order], order["Display Order Code"]))
            ) : (
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">No recent activity at the moment.</p>
            )}
          </div>
        </div>
      </div>

      {showDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg max-w-lg w-full">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Cancel Order</h2>
            {itemsOptions.length > 0 ? (
              <div>
                <label className="block text-sm sm:text-base lg:text-lg text-gray-700 mb-2">Select item or entire order:</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm sm:text-base lg:text-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition duration-150 ease-in-out"
                  defaultValue=""
                  onChange={handleItemChange}
                >
                  <option value="" disabled hidden>Select item</option>
                  {itemsOptions.map((item, index) => (
                    <option key={index} value={item}>{item}</option>
                  ))}
                </select>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm sm:text-base lg:text-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition duration-150 ease-in-out mt-4"
                  rows="4"
                  placeholder="Please enter the reason for cancellation"
                  value={reason}
                  onChange={handleReasonChange}
                />
              </div>
            ) : (
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm sm:text-base lg:text-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition duration-150 ease-in-out"
                rows="4"
                placeholder="Please enter the reason for cancellation"
                value={reason}
                onChange={handleReasonChange}
              />
            )}
            <div className="flex justify-end space-x-4 mt-4">
              <button
                className="bg-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm sm:text-base lg:text-lg font-semibold hover:bg-gray-400 transition duration-150 ease-in-out"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white rounded-lg px-4 py-2 text-sm sm:text-base lg:text-lg font-semibold hover:bg-blue-600 transition duration-150 ease-in-out"
                onClick={handleConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
