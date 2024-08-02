import React, { useState, useEffect } from 'react';
import './OrderPage.css';

export default function ModifyPage({ order, onClose }) {
  const [modifiedOrder, setModifiedOrder] = useState(order);
  const [modificationType, setModificationType] = useState('');
  const [modificationDetails, setModificationDetails] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleModify = () => {
    console.log('Modified order:', modifiedOrder);
    alert('Order modification saved successfully!');
    onClose();
  };

  const handleChange = (itemCode, key, value) => {
    setModifiedOrder((prev) => {
      const updatedOrder = { ...prev };
      Object.keys(updatedOrder).forEach((typeName) => {
        updatedOrder[typeName] = updatedOrder[typeName].map((item) =>
          item["Sale Order Item Code"] === itemCode
            ? { ...item, [key]: value }
            : item
        );
      });
      return updatedOrder;
    });
  };

  const containerStyle = {
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    maxWidth: 'lg',
    width: '100%',
    margin: '0 auto'
  };

  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    marginTop: '1rem'
  };

  if (isMobile) {
    containerStyle.padding = '1rem';
    containerStyle.maxWidth = '100%';
    buttonContainerStyle.flexDirection = 'column';
    buttonContainerStyle.alignItems = 'flex-end';
  }

  return (
    <div style={containerStyle}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Modify Order</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', color: '#4A5568', marginBottom: '0.5rem' }}>What do you want to modify?</label>
        {/* Add input for modification details if needed */}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input 
            type="radio" 
            id="msd" 
            name="modificationType" 
            value="MSD" 
            checked={modificationType === 'MSD'} 
            onChange={(e) => setModificationType(e.target.value)} 
          />
          <label htmlFor="msd" style={{ marginLeft: '0.5rem', marginRight: '1rem' }}>MSD</label>

          <input 
            type="radio" 
            id="mod" 
            name="modificationType" 
            value="MOD"
            checked={modificationType === 'MOD'} 
            onChange={(e) => setModificationType(e.target.value)} 
          />
          <label htmlFor="mod" style={{ marginLeft: '0.5rem' }}>MOD</label>
        </div>
      </div>

      <div style={buttonContainerStyle}>
        <button 
          onClick={handleModify} 
          style={{ backgroundColor: '#3B82F6', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem' }}
        >
          Save Changes
        </button>
        <button 
          onClick={onClose} 
          style={{ backgroundColor: '#D1D5DB', color: 'black', padding: '0.5rem 1rem', borderRadius: '0.25rem' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
