const axios = require('axios');
const csv = require('csv-parser');
const { MongoClient } = require('mongodb');
const cron = require('node-cron');
const { checkAndRefreshToken, getAccessTokenValue } = require('./auth.cjs');

// MongoDB setup
const uri = "mongodb+srv://FLO:FLO@flo.dhcuose.mongodb.net/FLO?retryWrites=true&w=majority&appName=Flo";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const dbName = 'Flo';
const collectionName = 'saleorders';

// Function to get the current date and the date 3 months ago in milliseconds
const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    // Convert the dates to milliseconds
    const startMilliseconds = startDate.getTime();
    const endMilliseconds = endDate.getTime();

    return {
        start: startMilliseconds,
        end: endMilliseconds
    };
};

// Function to create export job and get job code
const getJobCode = async () => {
    const { start, end } = getDateRange(); // Use dynamically calculated date range

    const url = 'https://flomattresses.unicommerce.com/services/rest/v1/export/job/create';
    const payload = {
        "exportJobTypeName": "Sale Orders",
        "exportColums": [
            "soicode", "displayorderCode", "reversePickupCode", "reversePickupCreatedDate",
            "reversePickupReason", "notificationEmail", "notificationMobile", "requireCustomization",
            "cod", "shippingAddressId", "category", "invoiceCode", "invoiceCreated", "ewbNo",
            "ewbDate", "ewbValidTill", "shippingAddressName", "shippingAddressLine1",
            "shippingAddressLine2", "shippingAddressCity", "shippingAddressState",
            "shippingAddressCountry", "shippingAddressPincode", "shippingAddressPhone",
            "billingAddressId", "billingAddressName", "billingAddressLine1", "billingAddressLine2",
            "billingAddressCity", "billingAddressState", "billingAddressCountry",
            "billingAddressPincode", "billingAddressPhone", "shippingMethod", "skuCode",
            "channelProductId", "itemTypeName", "itemTypeColor", "itemTypeSize", "itemTypeBrand",
            "channel", "itemRequireCustomization", "giftWrap", "giftMessage", "hsnCode",
            "maxRetailPrice", "totalPrice", "sellingPrice", "costPrice", "prepaidAmount",
            "subtotal", "discount", "gstTaxTypeCode", "cgst", "igst", "sgst", "utgst",
            "cess", "cgstrate", "igstrate", "sgstrate", "utgstrate", "cessrate", "TCSAmount",
            "tax", "taxValue", "voucherCode", "shippingCharges", "shippingMethodCharges",
            "cashOnDeliveryCharges", "giftWrapCharges", "packetNumber", "displayOrderDateTime",
            "saleOrderCode", "onhold", "status", "priority", "currency", "currencyConversionRate",
            "SoiStatus", "cancellationReason", "shippingProvider", "shippingCourier",
            "shippingArrangedBy", "ShippingPackageCode", "ShippingPackageCreationDate",
            "shippingPackageStatusCode", "shippingPackageTypeCode", "shippingPackageLength",
            "shippingPackageWidth", "shippingPackageHeight", "deliveryTime", "TrackingNumber",
            "dispatchDate", "facility", "returnedDate", "returnReason", "returnRemarks",
            "created", "updated", "combinationIdentifier", "combinationDescription", "transferPrice",
            "itemCode", "imei", "actualWeight", "gsttin", "Cgsttin", "tin", "paymentInstrc",
            "fulfillmentTat", "ajustmentInSellingPrice", "ajustmentInDiscount", "storeCredit",
            "irn", "acknowledgementNumber", "bundleSkuCode", "skuName", "batchCode",
            "vendorBatchNumber", "sellerSkuCode", "itemTypeEAN", "shippingCourierStatus",
            "shippingTrackingStatus", "itemSealId", "parentSaleOrderCode",
            "saleOrderItemCustomFields_Dimensions", "saleOrderCustomFields_PaymentGatewayName",
            "saleOrderCustomFields_Payment_Method"
        ],
        "exportFilters": [
            {
                "id": "addedOn",
                "dateRange": {
                    "start": start,
                    "end": end
                }
            }
        ],
        "scheduleTime": null,
        "notificationEmail": "data.analyst@flomattress.com",
        "frequency": "ONETIME",
        "reportName": "Sales_Orders_Report"
    };

    try {
        await checkAndRefreshToken(); // Ensure the token is valid
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessTokenValue()}`,
                'Facility': "FloBadlapur"
            }
        });
        console.log("Export Job Created. Job Code:", response.data.jobCode);
        return response.data.jobCode;
    } catch (error) {
        console.error("Error creating export job:", error.response ? error.response.data : error.message);
        return null;
    }
};

// Function to poll job status until completed
const pollJobStatus = async (jobCode) => {
    const url = 'https://flomattresses.unicommerce.com/services/rest/v1/export/job/status';
    const payload = { jobCode };

    let attempts = 0;
    const maxAttempts = 3; // Reduced attempts since we retry until the status is complete
    let filePath = null;

    while (attempts < maxAttempts) {
        try {
            await checkAndRefreshToken(); // Ensure the token is valid
            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAccessTokenValue()}`,
                    'Facility': "FloBadlapur"
                }
            });

            console.log("Export Job Status:", response.data);

            if (response.data.status === 'COMPLETE' && response.data.filePath) {
                filePath = response.data.filePath;
                console.log("File path found:", filePath);
                break; // Exit loop once the job is complete and filePath is found
            }

            if (response.data.status === 'FAILED') {
                throw new Error("Export job failed.");
            }

            attempts++;
            console.log(`Attempt ${attempts}/${maxAttempts}. Waiting 30 seconds before next poll.`);
            await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds before polling again

        } catch (error) {
            console.error("Error polling export job status:", error.response ? error.response.data : error.message);
            return null;
        }
    }

    if (!filePath) {
        console.error("Max attempts reached or no file path found. Job might not be completed properly.");
    }

    return filePath;
};

// Function to download and process CSV
const downloadAndProcessCsv = async (csvUrl) => {
    console.log(`Downloading CSV from URL: ${csvUrl}`);

    try {
        const response = await axios.get(csvUrl, { responseType: 'stream' });
        const data = [];
        
        response.data.pipe(csv())
            .on('data', (row) => {
                console.log("CSV Row:", row); // Log each row for debugging
                data.push(row);
            })
            .on('end', async () => {
                console.log("CSV file processed. Number of rows:", data.length);
                await updateDatabase(data);
            })
            .on('error', (error) => {
                console.error("Error processing CSV data:", error.message);
            });
    } catch (error) {
        console.error("Error downloading or processing CSV file:", error.response ? error.response.data : error.message);
    }
};

// Function to update the MongoDB database
const updateDatabase = async (data) => {
    console.log("Starting database update");

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        for (const item of data) {
            console.log("Updating item in database:", item);
            const filter = { "Sale Order Item Code": item["Sale Order Item Code"] };
            const update = { $set: item };
            await collection.updateOne(filter, update, { upsert: true });
        }

        console.log("Database updated successfully");
    } catch (error) {
        console.error("Error updating database:", error.message);
    } finally {
        await client.close();
        console.log("MongoDB connection closed");
    }
};

// Schedule job every 15 minutes
cron.schedule('*/3 * * * *', async () => {
    console.log("Starting scheduled job");

    const jobCode = await getJobCode();
    if (jobCode) {
        let filePath = await pollJobStatus(jobCode);
        if (filePath) {
            await downloadAndProcessCsv(filePath);
        } else {
            console.error("No CSV file path returned or job failed.");
        }
    } else {
        console.error("No job code returned or job creation failed.");
    }

    console.log("Scheduled job finished");
});
