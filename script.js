// =====================================================
// SWEETMOMENTS ORDER SYSTEM
// Google Sheets Connection
// =====================================================


// =====================================================
// GOOGLE APPS SCRIPT URL
// =====================================================

// PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE

const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbx0jtTjiawBVLbFfXuIl80R18C6dXkJ6MYk9pMETYAPVAeQDuoJol8XtHX9EkHCPcQW_Q/exec";


// =====================================================
// GLOBAL ORDERS
// =====================================================

let allOrders = [];


// =====================================================
// CURRENT DATE
// =====================================================

function showCurrentDate() {

    const today = new Date();

    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };

    const dateElement =
        document.getElementById("currentDate");

    if (dateElement) {

        dateElement.textContent =
            today.toLocaleDateString(
                "en-US",
                options
            );
    }
}


// =====================================================
// MINIMUM DELIVERY DATE
// 2 DAYS ADVANCE
// =====================================================

function setMinimumDeliveryDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    const minimumDateString =
        `${year}-${month}-${day}`;

    const deliveryDate =
        document.getElementById("deliveryDate");

    if (deliveryDate) {
        deliveryDate.min = minimumDateString;
    }
}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


// =====================================================
// GET DATE +2 DAYS
// =====================================================

function getDatePlusDays(days) {

    const date =
        new Date();

    date.setHours(
        0,
        0,
        0,
        0
    );

    date.setDate(
        date.getDate() + days
    );

    return formatDate(date);

}


// =====================================================
// DISPLAY DATE
// =====================================================

function displayDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(
            dateString + "T00:00:00"
        );


    if (isNaN(date)) {
        return dateString;
    }


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


// =====================================================
// LOAD ORDERS FROM GOOGLE SHEET
// =====================================================

async function loadOrders() {

    const table =
        document.getElementById(
            "orderTable"
        );


    if (table) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="11"
                    class="loading"
                >

                    Loading orders...

                </td>

            </tr>

        `;

    }


    try {

        const response =
            await fetch(
                GOOGLE_SCRIPT_URL
            );


        if (!response.ok) {

            throw new Error(
                "Unable to connect to Google Sheets."
            );

        }


        const orders =
            await response.json();


        allOrders =
            Array.isArray(orders)
                ? orders
                : [];


        // Sort by delivery date and time

        sortOrders();


        // Display everything

        displayAllOrders();

        displayUpcomingDeliveries();
        checkDeliveryAlarms();


    }

    catch (error) {

        console.error(error);


        if (table) {

            table.innerHTML = `

                <tr>

                    <td
                        colspan="12"
                        class="loading"
                    >

                        Unable to connect to
                        Google Sheets.

                        <br><br>

                        Check your Apps Script URL.

                    </td>

                </tr>

            `;

        }

    }

}


// =====================================================
// SORT ORDERS
// EARLIEST DELIVERY FIRST
// =====================================================

function sortOrders() {

    allOrders.sort(
        function(a, b) {

            const dateA =
                new Date(
                    a.deliveryDate +
                    " " +
                    convertTime(
                        a.deliveryTime
                    )
                );


            const dateB =
                new Date(
                    b.deliveryDate +
                    " " +
                    convertTime(
                        b.deliveryTime
                    )
                );


            return dateA - dateB;

        }
    );

}


// =====================================================
// CONVERT TIME
// =====================================================

function convertTime(time) {

    if (!time) {
        return "00:00";
    }


    const parts =
        time.trim().split(" ");


    if (parts.length !== 2) {
        return time;
    }


    let timePart =
        parts[0];

    const ampm =
        parts[1].toUpperCase();


    let timeParts =
        timePart.split(":");


    let hour =
        parseInt(
            timeParts[0]
        );

    const minute =
        timeParts[1];


    if (ampm === "PM" && hour !== 12) {

        hour += 12;

    }


    if (ampm === "AM" && hour === 12) {

        hour = 0;

    }


    return (
        String(hour).padStart(2, "0") +
        ":" +
        minute
    );

}

// =====================================================
// DISPLAY ALL ORDERS
// =====================================================

function displayAllOrders() {

    const table =
        document.getElementById(
            "orderTable"
        );

    // ==========================================
    // HIDE PAST ORDERS
    // DISPLAY TODAY + FUTURE ONLY
    // ==========================================

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const upcomingOrders =
        allOrders.filter(function(order) {

            if (!order.deliveryDate) {
                return false;
            }

            const deliveryDate =
                new Date(
                    order.deliveryDate + "T00:00:00"
                );

            deliveryDate.setHours(0, 0, 0, 0);

            return deliveryDate >= today;

        });


    if (!table) {
        return;
    }


    if (upcomingOrders.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="12"
                    class="loading"
                >

                    No orders recorded yet.

                </td>

            </tr>

        `;

        return;

    }


    table.innerHTML = "";


    upcomingOrders.forEach(
        function(order) {

            const row =
                document.createElement("tr");


            // ==========================================
            // GMAIL SEARCH LINK
            // SEARCH CUSTOMER / ORDER NUMBER
            // ==========================================

            const gmailSearch =
                "https://mail.google.com/mail/u/0/#search/" +
                encodeURIComponent(
                    '"' + String(order.orderNo) + '"'
                );


            row.innerHTML = `

           <td>

    <button
        type="button"
        class="order-number gmail-order-button"
        onclick="openOrderEmail(
            '${escapeHTML(order.orderNo)}',
            '${escapeHTML(order.customerNumber)}'
        )"
        title="Click to search this order in Gmail"
    >

        ${escapeHTML(
            order.orderNo
        )}

    </button>

</td>


                <td>

                    ${escapeHTML(
                        order.dateEncoded
                    )}

                </td>


                <td>

                    <strong>

                        ${escapeHTML(
                            order.customerNumber
                        )}

                    </strong>

                </td>


                <td>

                    ${escapeHTML(
                        order.flavor
                    )}

                </td>


                <td>

                    ${getStatusBadge(
                        order.orderStatus
                    )}

                    ${
                        String(order.orderStatus)
                            .trim()
                            .toLowerCase() ===
                            "waiting for payment"
                        ? `
                            <button
                                type="button"
                                class="paid-btn"
                                onclick="markOrderAsPaid('${escapeHTML(order.orderNo)}')"
                            >
                                ✓ PAID
                            </button>
                        `
                        : ""
                    }

                </td>


                <td>

                    <span class="note-badge">

                        ${escapeHTML(
                            order.notes
                        )}

                    </span>

                </td>


                <td>

                    ${escapeHTML(
                        order.paymentMethod
                    )}

                </td>


                <td>

                    ${getOrderType(
                        order.orderType
                    )}

                </td>


                <td>

                    ${displayDate(
                        order.deliveryDate
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        order.deliveryTime
                    )}

                </td>


                <td>

                    <span class="note-badge">

                        ${escapeHTML(
                            order.prepareTo
                        )}

                    </span>

                </td>


                <td class="decorator-cell">

                    <input
                        type="text"
                        class="decorator-input"
                        list="decoratorList"
                        value="${escapeHTML(
                            order.decoratorAssign || ""
                        )}"
                        placeholder="Assign Decorator"
                        data-order-no="${escapeHTML(
                            order.orderNo
                        )}"
                    >

                    <button
                        type="button"
                        class="decorator-save-btn"
                        onclick="saveDecoratorAssignment(this)"
                    >
                        Save
                    </button>

                </td>

            `;


            table.appendChild(row);

        }
    );

}
// =====================================================
// STATUS BADGE
// =====================================================

function getStatusBadge(status) {

    let className =
        "status-waiting";


    if (status === "Downpayment") {

        className =
            "status-downpayment";

    }


    if (status === "Paid") {

        className =
            "status-paid";

    }


    return `

        <span class="status ${className}">

            ${escapeHTML(status)}

        </span>

    `;

}


// =====================================================
// ORDER TYPE
// =====================================================

function getOrderType(type) {

    if (type === "Delivery") {

        return `

            <span class="type-delivery">

                🚚 Delivery

            </span>

        `;

    }


    return `

        <span class="type-pickup">

            📦 Pick Up

        </span>

    `;

}


// =====================================================
// UPCOMING DELIVERY DISPLAY
// =====================================================

function displayUpcomingDeliveries() {

    const today =
        getDatePlusDays(0);

    const tomorrow =
        getDatePlusDays(1);

    const dayAfter =
        getDatePlusDays(2);


    document.getElementById(
        "todayDate"
    ).textContent =
        displayDate(today);


    document.getElementById(
        "tomorrowDate"
    ).textContent =
        displayDate(tomorrow);


    document.getElementById(
        "dayAfterDate"
    ).textContent =
        displayDate(dayAfter);


    displayDayOrders(
        "todayOrders",
        today
    );


    displayDayOrders(
        "tomorrowOrders",
        tomorrow
    );


    displayDayOrders(
        "dayAfterOrders",
        dayAfter
    );

}


// =====================================================
// DISPLAY ORDERS FOR A SPECIFIC DAY
// =====================================================

function displayDayOrders(
    elementId,
    date
) {

    const container =
        document.getElementById(
            elementId
        );


    if (!container) {
        return;
    }


    const orders =
        allOrders.filter(
            function(order) {

                return (
                    order.deliveryDate ===
                    date
                );

            }
        );


    // IMPORTANT:
    // Earliest time first

    orders.sort(
        function(a, b) {

            return convertTime(
                a.deliveryTime
            ).localeCompare(
                convertTime(
                    b.deliveryTime
                )
            );

        }
    );


    if (orders.length === 0) {

        container.innerHTML = `

            <div class="empty-message">

                No orders

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    orders.forEach(
        function(order) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "delivery-item";


            item.innerHTML = `

                <div class="delivery-time">

                    ${escapeHTML(
                        order.deliveryTime
                    )}

                </div>


                <div class="delivery-number">

                    #${escapeHTML(
                        order.orderNo
                    )}

                </div>


                <div class="delivery-customer">

                    ${escapeHTML(
                        order.customerNumber
                    )}

                </div>


                <div class="delivery-flavor">

                    🍰 ${escapeHTML(
                        order.flavor
                    )}

                </div>


                <div>

                    ${getStatusBadge(
                        order.orderStatus
                    )}

                </div>


                <div class="delivery-type">

                    ${escapeHTML(
                        order.orderType
                    )}

                </div>

            `;


            container.appendChild(item);

        }
    );

}


// =====================================================
// SEARCH / FILTER
// =====================================================

function filterOrders() {

    const searchBox =
        document.getElementById(
            "searchBox"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const search =
        searchBox.value
            .toLowerCase()
            .trim();


    const status =
        statusFilter.value;


    const filtered =
        allOrders.filter(
            function(order) {

                const text = (

                    String(
                        order.orderNo
                    ) +

                    " " +

                    String(
                        order.customerNumber
                    ) +

                    " " +

                    String(
                        order.flavor
                    ) +

                    " " +

                    String(
                        order.orderStatus
                    )

                ).toLowerCase();


                const matchesSearch =
                    text.includes(search);


                const matchesStatus =
                    status === "All" ||
                    order.orderStatus === status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    displayFilteredOrders(
        filtered
    );

}


// =====================================================
// DISPLAY FILTERED TABLE
// =====================================================

function displayFilteredOrders(
    orders
) {

    const table =
        document.getElementById(
            "orderTable"
        );


    table.innerHTML = "";


    if (orders.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="12"
                    class="loading"
                >

                    No matching orders.

                </td>

            </tr>

        `;

        return;

    }


    orders.forEach(
        function(order) {

            const row =
                document.createElement("tr");


            // ==========================================
            // GMAIL SEARCH LINK
            // SEARCH CUSTOMER / ORDER NUMBER
            // ==========================================

            const gmailSearch =
                "https://mail.google.com/mail/u/0/#search/" +
                encodeURIComponent(
                    '"' + String(order.orderNo) + '"'
                );


            row.innerHTML = `

               <td>

    <button
        type="button"
        class="order-number gmail-order-button"
        onclick="openOrderEmail(
            '${escapeHTML(order.orderNo)}',
            '${escapeHTML(order.customerNumber)}'
        )"
        title="Click to search this order in Gmail"
    >

        ${escapeHTML(
            order.orderNo
        )}

    </button>

</td>


                <td>

                    ${escapeHTML(
                        order.dateEncoded
                    )}

                </td>


                <td>

                    <strong>

                        ${escapeHTML(
                            order.customerNumber
                        )}

                    </strong>

                </td>


                <td>

                    ${escapeHTML(
                        order.flavor
                    )}

                </td>


                <td>

                    ${getStatusBadge(
                        order.orderStatus
                    )}

                    ${
                        String(order.orderStatus)
                            .trim()
                            .toLowerCase() ===
                            "waiting for payment"
                        ? `
                            <button
                                type="button"
                                class="paid-btn"
                                onclick="markOrderAsPaid('${escapeHTML(order.orderNo)}')"
                            >
                                ✓ PAID
                            </button>
                        `
                        : ""
                    }

                </td>


                <td>

                    <span class="note-badge">

                        ${escapeHTML(
                            order.notes
                        )}

                    </span>

                </td>


                <td>

                    ${escapeHTML(
                        order.paymentMethod
                    )}

                </td>


                <td>

                    ${getOrderType(
                        order.orderType
                    )}

                </td>


                <td>

                    ${displayDate(
                        order.deliveryDate
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        order.deliveryTime
                    )}

                </td>


                <td>

                    <span class="note-badge">

                        ${escapeHTML(
                            order.prepareTo
                        )}

                    </span>

                </td>


                <td class="decorator-cell">

                    <input
                        type="text"
                        class="decorator-input"
                        list="decoratorList"
                        value="${escapeHTML(
                            order.decoratorAssign || ""
                        )}"
                        placeholder="Assign Decorator"
                        data-order-no="${escapeHTML(
                            order.orderNo
                        )}"
                    >

                    <button
                        type="button"
                        class="decorator-save-btn"
                        onclick="saveDecoratorAssignment(this)"
                    >
                        Save
                    </button>

                </td>

            `;


            table.appendChild(row);

        }
    );

}
// =====================================================
// SEND ORDER TO GOOGLE SHEETS
// =====================================================

document
    .getElementById("orderForm")
    .addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const button =
                document.getElementById(
                    "saveButton"
                );


            const message =
                document.getElementById(
                    "message"
                );


            // Get form values

            const customerNumber =
                document
                    .getElementById(
                        "customerNumber"
                    )
                    .value
                    .trim();


            const flavor =
                document
                    .getElementById(
                        "flavor"
                    )
                    .value;


            const orderStatus =
                document
                    .getElementById(
                        "orderStatus"
                    )
                    .value;


            const notesType =
    document
        .getElementById("notes")
        .value;

const notesDescription =
    document
        .getElementById("notesDescription")
        .value
        .trim();

const notes =
    notesDescription
        ? notesType + " - " + notesDescription
        : notesType;


            const paymentMethod =
                document
                    .getElementById(
                        "paymentMethod"
                    )
                    .value;


            const orderType =
                document
                    .getElementById(
                        "orderType"
                    )
                    .value;
            const prepareTo =
                  document
                   .getElementById(
                     "prepareTo"
                   )
               .value;

            const deliveryDate =
                document
                    .getElementById(
                        "deliveryDate"
                    )
                    .value;


            const deliveryTime =
                document
                    .getElementById(
                        "deliveryTime"
                    )
                    .value;


            // Validation

           if (
    !customerNumber ||
    !flavor ||
    !orderStatus ||
    !notes ||
    !paymentMethod ||
    !orderType ||
    !prepareTo ||
    !deliveryDate ||
    !deliveryTime
) {

                message.textContent =
                    "Please complete all fields.";

                message.style.color =
                    "#d32f2f";

                return;

            }


            // Check 2-day advance

          const today = new Date();
today.setHours(0, 0, 0, 0);

const selectedDate = new Date(deliveryDate);
selectedDate.setHours(0, 0, 0, 0);

if (selectedDate < today) {
    message.textContent =
        "Delivery date cannot be in the past.";
    message.style.color = "#d32f2f";
    return;
}


            // Disable button

            button.disabled =
                true;


            button.textContent =
                "Saving Order...";


            message.textContent =
                "Sending order to Google Sheets...";


            message.style.color =
                "#c2185b";


            // Data to Google Apps Script

const orderData = {

    customerNumber:
        customerNumber,

    flavor:
        flavor,

    orderStatus:
        orderStatus,

    notes:
        notes,

    paymentMethod:
        paymentMethod,

    orderType:
        orderType,

    deliveryDate:
        deliveryDate,

    deliveryTime:
        deliveryTime,

    prepareTo:
        prepareTo

};


            try {

                await fetch(
                    GOOGLE_SCRIPT_URL,
                    {

                        method:
                            "POST",

                        mode:
                            "no-cors",

                        headers: {

                            "Content-Type":
                                "text/plain;charset=utf-8"

                        },

                        body:
                            JSON.stringify(
                                orderData
                            )

                    }
                );
try {

    const response =
        await fetch(
            GOOGLE_SCRIPT_URL,
            {
                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body:
                    JSON.stringify(
                        orderData
                    )
            }
        );


    // ==========================================
    // READ GOOGLE APPS SCRIPT RESPONSE
    // ==========================================

    const result =
        await response.json();


    console.log(
        "Google Apps Script response:",
        result
    );


    // ==========================================
    // DUPLICATE ORDER
    // ==========================================

    if (
        result.success === false &&
        result.duplicate === true
    ) {

        message.textContent =
            "❌ Duplicate Order: " +
            result.error;

        message.style.color =
            "#d32f2f";


        // DO NOT RESET FORM
        // DO NOT RELOAD ORDERS
        // DO NOT SHOW SUCCESS

        return;

    }


    // ==========================================
    // OTHER SAVE ERROR
    // ==========================================

    if (
        result.success !== true
    ) {

        message.textContent =
            "❌ Unable to save order: " +
            (
                result.error ||
                "Unknown error."
            );

        message.style.color =
            "#d32f2f";


        return;

    }


    // ==========================================
    // SUCCESS
    // ==========================================

    message.textContent =
        "✓ Order saved successfully! " +
        "Order #" +
        result.orderNo;

    message.style.color =
        "#2e7d32";


    // ==========================================
    // RESET ALL ORDER FIELDS
    // ONLY AFTER SUCCESS
    // ==========================================

    document
        .getElementById("orderForm")
        .reset();


    // ==========================================
    // RESET PREPARE TO
    // ==========================================

    const prepareToSelect =
        document.getElementById("prepareTo");


    if (prepareToSelect) {

        prepareToSelect.selectedIndex =
            0;

        prepareToSelect.value =
            "";

    }


    // ==========================================
    // RESTORE MINIMUM DELIVERY DATE
    // ==========================================

    setMinimumDeliveryDate();


    // ==========================================
    // REFRESH GOOGLE SHEET DATA
    // ==========================================

    setTimeout(
        function() {

            loadOrders();

        },
        1000
    );

}

catch (error) {

    console.error(
        "Save order error:",
        error
    );


    message.textContent =
        "Unable to save order. " +
        "Please check the Google Apps Script connection.";

    message.style.color =
        "#d32f2f";

}


// ==========================================
// RESET ALL ORDER FIELDS
// ==========================================

document
    .getElementById("orderForm")
    .reset();


// ==========================================
// RESET PREPARE TO
// ==========================================

const prepareToSelect =
    document.getElementById("prepareTo");

if (prepareToSelect) {

    prepareToSelect.selectedIndex = 0;

    prepareToSelect.value = "";

}


// ==========================================
// RESTORE MINIMUM DELIVERY DATE
// ==========================================

setMinimumDeliveryDate();


// ==========================================
// REFRESH GOOGLE SHEET DATA
// ==========================================

setTimeout(
    function() {

        loadOrders();

    },
    1000
);

            }

            catch (error) {

                console.error(error);


                message.textContent =
                    "Unable to save order. Please check the Google Apps Script connection.";

                message.style.color =
                    "#d32f2f";

            }


            button.disabled =
                false;


            button.textContent =
                "🌸 Add Order";

        }
    );


// =====================================================
// HTML SECURITY
// =====================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// START WEBSITE
// =====================================================

showCurrentDate();

setMinimumDeliveryDate();

loadOrders();


// =====================================================
// AUTO REFRESH EVERY 10 SECONDS
// =====================================================

setInterval(
    function() {

        loadOrders();

    },
    500000
);

async function markOrderAsPaid(orderNo) {

    const confirmed = confirm(
        "Mark Order #" + orderNo + " as PAID?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            "https://script.google.com/macros/s/AKfycbx0jtTjiawBVLbFfXuIl80R18C6dXkJ6MYk9pMETYAPVAeQDuoJol8XtHX9EkHCPcQW_Q/exec",
            {
                method: "POST",

                body: JSON.stringify({
                    action: "updateStatus",
                    orderNo: orderNo,
                    status: "Paid"
                })
            }
        );

        const result = await response.json();

        if (!result.success) {

            alert(
                "Unable to update order:\n" +
                result.error
            );

            return;
        }

        alert(
            "✓ Order #" +
            orderNo +
            " is now PAID."
        );

        // Reload the orders
        loadOrders();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to update the order."
        );
    }
}
// =====================================================
// DELIVERY ALARM - 1 HOUR BEFORE
// =====================================================

let alertedOrders = new Set();

function checkDeliveryAlarms() {

    if (!Array.isArray(allOrders)) {
        return;
    }

    const now = new Date();

    allOrders.forEach(function(order) {

        if (
            !order.deliveryDate ||
            !order.deliveryTime
        ) {
            return;
        }


        // Convert AM/PM time correctly

        const time24 =
            convertTime(
                order.deliveryTime
            );


        const deliveryDateTime =
            new Date(
                order.deliveryDate +
                "T" +
                time24 +
                ":00"
            );


        if (
            isNaN(
                deliveryDateTime.getTime()
            )
        ) {
            return;
        }


        // 1 hour before delivery

        const reminderTime =
            new Date(
                deliveryDateTime.getTime()
                - (60 * 60 * 1000)
            );


        const difference =
            now.getTime() -
            reminderTime.getTime();


        // Alarm can trigger during
        // the first 60 seconds after
        // the reminder time

        if (
            difference >= 0 &&
            difference < 60000 &&
            !alertedOrders.has(
                String(order.orderNo)
            )
        ) {

            alertedOrders.add(
                String(order.orderNo)
            );


            playDeliveryAlarm();

            showDeliveryPopup(order);

        }

    });

}

// =====================================================
// ALARM SOUND
// =====================================================

function playDeliveryAlarm() {

    const audioContext =
        new (
            window.AudioContext ||
            window.webkitAudioContext
        )();

    function beep(delay) {

        setTimeout(function() {

            const oscillator =
                audioContext.createOscillator();

            const gain =
                audioContext.createGain();

            oscillator.connect(gain);

            gain.connect(
                audioContext.destination
            );

            oscillator.frequency.value =
                900;

            gain.gain.setValueAtTime(
                0.5,
                audioContext.currentTime
            );

            oscillator.start();

            oscillator.stop(
                audioContext.currentTime + 0.5
            );

        }, delay);
    }

    beep(0);
    beep(700);
    beep(1400);
    beep(2100);
}


// =====================================================
// DELIVERY POPUP
// =====================================================

function showDeliveryPopup(order) {

    alert(
        "🔔 DELIVERY REMINDER!\n\n" +

        "Order #: " +
        order.orderNo +

        "\n\nDelivery Date: " +
        order.deliveryDate +

        "\nDelivery Time: " +
        order.deliveryTime +

        "\n\n⚠️ DELIVERY IS IN 1 HOUR!"
    );
}
// =====================================================
// DECORATOR WHATSAPP NUMBERS
// =====================================================

const DECORATOR_PHONES = {

    "Joan": "97430870324",

    "Christal": "97430327045",

    "Juliano": "639519764280",

    "Fritz": "97474489232",

    "Hensly": "97474450644",

    "Altaf": "97477939168",

    "Michelle": "97433539756",

    "Jean Gay": "97477781639",
    "Nea": "97474489153"

};
// =====================================================
// SAVE DECORATOR + OPEN WHATSAPP
// =====================================================

async function saveDecoratorAssignment(button) {

    console.log("=================================");
    console.log("DECORATOR SAVE STARTED");
    console.log("=================================");


    // =================================================
    // GET CELL
    // =================================================

    const cell =
        button.closest(".decorator-cell");


    if (!cell) {

        alert("Decorator cell not found.");

        return;

    }


    // =================================================
    // GET INPUT
    // =================================================

    const input =
        cell.querySelector(".decorator-input");


    if (!input) {

        alert("Decorator input not found.");

        return;

    }


    // =================================================
    // GET ORDER NUMBER
    // =================================================

    const orderNo =
        input.getAttribute("data-order-no");


    // =================================================
    // GET DECORATOR
    // =================================================

    const decorator =
        input.value.trim();


    console.log("Order:", orderNo);
    console.log("Decorator:", decorator);


    // =================================================
    // CHECK DECORATOR
    // =================================================

    if (!decorator) {

        alert(
            "Please select a decorator first."
        );

        return;

    }


    // =================================================
    // FIND ORDER
    // =================================================

    const order =
        allOrders.find(function(item) {

            return String(item.orderNo) ===
                   String(orderNo);

        });


    if (!order) {

        alert(
            "Order #" +
            orderNo +
            " not found."
        );

        return;

    }


    // =================================================
    // GET WHATSAPP NUMBER
    // =================================================

    const phone =
        DECORATOR_PHONES[decorator];


    console.log("WhatsApp phone:", phone);


    if (!phone) {

        alert(
            "No WhatsApp number is assigned to " +
            decorator
        );

        return;

    }


    // =================================================
    // CREATE WHATSAPP MESSAGE
    // =================================================

    const whatsappMessage =

        "🌸 SWEETMOMENTS ORDER 🌸\n\n" +

        "Hello " +
        decorator +
        "! 👋\n\n" +

        "You have been assigned a new order.\n\n" +

        "━━━━━━━━━━━━━━━━━━\n" +

        "📋 ORDER DETAILS\n" +

        "━━━━━━━━━━━━━━━━━━\n\n" +

        "Order #: " +
        order.orderNo +

        "\nCustomer: " +
        order.customerNumber +

        "\nFlavor: " +
        order.flavor +

        "\nPrepare To: " +
        order.prepareTo +

        "\nDelivery Date: " +
        order.deliveryDate +

        "\nDelivery Time: " +
        order.deliveryTime +

        "\nOrder Type: " +
        order.orderType +

        "\nPayment Status: " +
        order.orderStatus +

        "\nNotes: " +
        order.notes +

        "\n\n━━━━━━━━━━━━━━━━━━\n" +

        "Please prepare the order accordingly, for more details check the email. 🌸";


    // =================================================
    // CREATE WHATSAPP URL
    // =================================================

    const whatsappURL =
        "https://wa.me/" +
        phone +
        "?text=" +
        encodeURIComponent(
            whatsappMessage
        );


    console.log(
        "WhatsApp URL:",
        whatsappURL
    );


    // =================================================
    // OPEN WHATSAPP
    //
    // IMPORTANT:
    // Open BEFORE fetch()
    // =================================================

    const whatsappWindow =
        window.open(
            whatsappURL,
            "_blank"
        );


    // =================================================
    // CHECK POPUP
    // =================================================

    if (!whatsappWindow) {

        alert(
            "WhatsApp could not be opened.\n\n" +
            "Please allow pop-ups for this website."
        );

    }


    // =================================================
    // DISABLE BUTTON
    // =================================================

    button.disabled = true;

    button.textContent =
        "Saving...";


    // =================================================
    // SAVE TO GOOGLE SHEETS
    // =================================================

    try {

        const response =
            await fetch(
                GOOGLE_SCRIPT_URL,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "text/plain;charset=utf-8"

                    },

                    body: JSON.stringify({

                        action:
                            "updateDecorator",

                        orderNo:
                            orderNo,

                        decorator:
                            decorator

                    })

                }
            );


        const result =
            await response.json();


        console.log(
            "Decorator response:",
            result
        );


        // =================================================
        // CHECK RESPONSE
        // =================================================

        if (!result.success) {

            throw new Error(
                result.error ||
                "Unable to save decorator."
            );

        }


        // =================================================
        // UPDATE LOCAL ORDER
        // =================================================

        order.decoratorAssign =
            decorator;


        // =================================================
        // SUCCESS
        // =================================================

        button.textContent =
            "Saved ✓";


        console.log(
            "✓ Decorator saved successfully"
        );


        setTimeout(function() {

            button.textContent =
                "Save";

        }, 2000);


    }

    catch (error) {

        console.error(
            "Decorator save error:",
            error
        );


        alert(
            "Unable to save Decorator Assign.\n\n" +
            error.message
        );


        button.textContent =
            "Save";

    }

    finally {

        button.disabled = false;

    }

}
// =====================================================
// OPEN ORDER EMAIL IN GMAIL
// =====================================================

function openOrderEmail(orderNo, customerNumber) {

    // Use customer number if available
    // Otherwise use order number

    const searchNumber =
        customerNumber ||
        orderNo;

    if (!searchNumber) {

        alert(
            "No order number or customer number available."
        );

        return;
    }


    // Gmail search
    const gmailURL =
        "https://mail.google.com/mail/u/0/#search/" +
        encodeURIComponent(
            '"' + String(searchNumber).trim() + '"'
        );


    // Open Gmail in a new tab

    window.open(
        gmailURL,
        "_blank",
        "noopener,noreferrer"
    );

}
// =====================================================
// OPEN ORDER EMAIL IN GMAIL
// =====================================================

function openOrderEmail(orderNo, customerNumber) {

    const searchNumber =
        customerNumber ||
        orderNo;

    if (!searchNumber) {

        alert(
            "No order number or customer number available."
        );

        return;
    }

    const gmailURL =
        "https://mail.google.com/mail/u/0/#search/" +
        encodeURIComponent(
            '"' + String(searchNumber).trim() + '"'
        );

    window.open(
        gmailURL,
        "_blank",
        "noopener,noreferrer"
    );

}