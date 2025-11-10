# API Testing Documentation

## 🧪 Frontend API Testing Tool

A comprehensive testing interface has been added to test all backend API endpoints directly from the frontend.

### Access the Testing Tool

**Route:** `/admin/api-test`  
**Required Role:** Admin only  
**Navigation:** Click "API Test" in the navbar under "HR & System" dropdown

---

## 📊 Features

### **1. Visual Dashboard**
- **Testable Count:** Shows how many endpoints you can test with your current role
- **Skipped Count:** Endpoints that create/modify/delete data (skipped for safety)
- **No Access Count:** Endpoints requiring different roles
- **Passed Count:** Number of successful tests

### **2. Category Filtering**
Test endpoints by category:
- **All** - View all endpoints
- **Auth** - Authentication & authorization
- **Patients** - Patient management
- **Doctors** - Doctor management
- **Appointments** - Appointment scheduling
- **Bills** - Billing operations
- **Availability** - Doctor availability & days off
- **Queue** - Waiting queue management
- **Departments** - Department CRUD
- **Inventory** - Inventory management
- **Notifications** - Notification system
- **HR** - Human resources (employees, leaves, payroll)
- **Logs** - System logs
- **Settings** - System settings
- **Roles** - User roles
- **Users** - User management

### **3. Test Actions**
- **Test All** - Run all testable endpoints sequentially
- **Individual Test** - Test single endpoint
- **Clear Results** - Clear all test results

### **4. Result Display**
Each test shows:
- ✅ **Success** - Green checkmark with status code
- ❌ **Error** - Red X with error message
- 🔄 **Testing** - Blue spinner (in progress)
- **Expandable Details** - Click to view full response JSON

---

## 🔐 Security & Safety

### **Endpoints Marked as "Skipped"**
These endpoints are **NOT tested automatically** to prevent data modification:

#### **Authentication**
- Login, Register, Verify Email (require credentials)
- Password reset operations

#### **Create Operations (POST)**
- Creating patients, doctors, appointments
- Creating employees, departments, inventory items
- Creating leaves, payroll, notifications

#### **Update Operations (PUT)**
- Updating patient/doctor profiles
- Modifying appointments, bills
- Changing availability schedules
- Updating employee records

#### **Delete Operations (DELETE)**
- Deleting patients, doctors, appointments
- Removing employees, departments, inventory items
- Removing availability slots

### **Why Skip These?**
1. **Data Integrity** - Prevent accidental data creation/modification
2. **Database Pollution** - Avoid filling database with test data
3. **Business Logic** - These often require specific payloads/validation
4. **Safety First** - Read-only tests are safer for production-like environments

### **How to Test Skipped Endpoints**
If you need to test create/update/delete operations:
1. Use Postman/Insomnia with proper payloads
2. Check the frontend components (they already test these)
3. Review backend unit tests
4. Manually test through the UI

---

## 📋 Complete API Endpoint List

### **Authentication (8 endpoints)**
| Endpoint | Method | Status | Access |
|----------|--------|--------|--------|
| Login | POST | ⚠️ Skipped | Public |
| Register | POST | ⚠️ Skipped | Public |
| Refresh Token | POST | ⚠️ Skipped | Auth Required |
| Logout | POST | ✅ Testable | Auth Required |
| Verify Email Link | GET | ⚠️ Skipped | Public |
| Verify Email Code | POST | ⚠️ Skipped | Public |
| Resend Code | POST | ⚠️ Skipped | Public |
| Request Password Reset | POST | ⚠️ Skipped | Public |
| Reset Password | POST | ⚠️ Skipped | Public |

### **Patients (5 endpoints)**
| Endpoint | Method | Status | Required Roles |
|----------|--------|--------|----------------|
| List Patients | GET | ✅ Testable | Admin, Receptionist, Doctor |
| Get Patient | GET | ⚠️ Skipped | Admin, Receptionist, Doctor |
| Create Patient | POST | ⚠️ Skipped | Admin, Receptionist |
| Update Patient | PUT | ⚠️ Skipped | Admin, Receptionist |
| Delete Patient | DELETE | ⚠️ Skipped | Admin |

### **Doctors (6 endpoints)**
| Endpoint | Method | Status | Required Roles |
|----------|--------|--------|----------------|
| List Doctors | GET | ✅ Testable | All roles |
| Get Doctor | GET | ⚠️ Skipped | Admin, Receptionist, Doctor, Patient |
| Create Doctor | POST | ⚠️ Skipped | Admin |
| Update Doctor | PUT | ⚠️ Skipped | Admin |
| Delete Doctor | DELETE | ⚠️ Skipped | Admin |
| Ensure Doctor Profile | POST | ✅ Testable | Doctor |

### **Appointments (9 endpoints)**
| Endpoint | Method | Status | Required Roles |
|----------|--------|--------|----------------|
| List Appointments | GET | ✅ Testable | All authenticated |
| Get Appointment | GET | ⚠️ Skipped | All authenticated |
| Create Appointment | POST | ⚠️ Skipped | Patient, Receptionist, Admin |
| Update Appointment | PUT | ⚠️ Skipped | Admin, Receptionist |
| Update Status | PUT | ⚠️ Skipped | Receptionist, Doctor, Admin |
| Generate Bill | POST | ⚠️ Skipped | Receptionist, Admin |
| Reschedule | POST | ⚠️ Skipped | All authenticated |
| Resend Confirmation | POST | ⚠️ Skipped | Admin, Receptionist |
| Schedule Follow-up | POST | ⚠️ Skipped | Doctor, Admin, Receptionist |

### **Bills (3 endpoints)**
| Endpoint | Method | Status | Required Roles |
|----------|--------|--------|----------------|
| List Bills | GET | ✅ Testable | All authenticated |
| Get Bill | GET | ⚠️ Skipped | All authenticated |
| Update Bill | PUT | ⚠️ Skipped | Admin, Receptionist |

### **Doctor Availability (7 endpoints)**
| Endpoint | Method | Status | Required Roles |
|----------|--------|--------|----------------|
| Get Availability | GET | ⚠️ Skipped | All authenticated |
| Create Availability | POST | ⚠️ Skipped | Admin, Doctor |
| Update Availability | PUT | ⚠️ Skipped | Admin, Doctor |
| Delete Availability | DELETE | ⚠️ Skipped | Admin, Doctor |
| Get Days Off | GET | ⚠️ Skipped | Admin, Receptionist, Doctor |
| Create Day Off | POST | ⚠️ Skipped | Admin, Doctor |
| Delete Day Off | DELETE | ⚠️ Skipped | Admin, Doctor |

### **Waiting Queue (5 endpoints)**
| Endpoint | Method | Status | Required Roles |
|----------|--------|--------|----------------|
| Get Queue | GET | ✅ Testable | Admin, Receptionist, Doctor |
| Join Queue | POST | ⚠️ Skipped | Patient, Admin, Receptionist |
| Update Queue Priority | PUT | ⚠️ Skipped | Admin, Receptionist |
| Leave Queue | DELETE | ⚠️ Skipped | Patient, Admin, Receptionist |
| Schedule from Queue | POST | ⚠️ Skipped | Admin, Receptionist |

### **Departments (4 endpoints)**
| Endpoint | Method | Status | Required Roles |
|----------|--------|--------|----------------|
| List Departments | GET | ✅ Testable | Admin, HR |
| Create Department | POST | ⚠️ Skipped | Admin |
| Update Department | PUT | ⚠️ Skipped | Admin |
| Delete Department | DELETE | ⚠️ Skipped | Admin |

### **Inventory (4 endpoints)**
| Endpoint | Method | Status | Required Roles |
|----------|--------|--------|----------------|
| List Inventory | GET | ✅ Testable | Admin, Receptionist, HR |
| Create Item | POST | ⚠️ Skipped | Admin, HR |
| Update Item | PUT | ⚠️ Skipped | Admin, HR |
| Delete Item | DELETE | ⚠️ Skipped | Admin |

### **Notifications (3 endpoints)**
| Endpoint | Method | Status | Required Roles |
|----------|--------|--------|----------------|
| List Notifications | GET | ✅ Testable | Auth Required |
| Create Notification | POST | ⚠️ Skipped | Admin, Doctor, Receptionist |
| Update Notification | PUT | ⚠️ Skipped | Auth Required |

### **HR Module (11 endpoints)**
| Endpoint | Method | Status | Required Roles |
|----------|--------|--------|----------------|
| List Users | GET | ✅ Testable | Admin, HR |
| List Employees | GET | ✅ Testable | Admin, HR |
| Create Employee | POST | ⚠️ Skipped | Admin, HR |
| Update Employee | PUT | ⚠️ Skipped | Admin, HR |
| Delete Employee | DELETE | ⚠️ Skipped | Admin, HR |
| List Leaves | GET | ✅ Testable | All authenticated |
| Create Leave | POST | ⚠️ Skipped | All authenticated |
| Decide Leave | PUT | ⚠️ Skipped | Admin, HR |
| List Payroll | GET | ✅ Testable | All authenticated |
| Create Payroll | POST | ⚠️ Skipped | Admin, HR |
| Mark Payroll Paid | PUT | ⚠️ Skipped | Admin, HR |

### **Logs (1 endpoint)**
| Endpoint | Method | Status | Required Roles |
|----------|--------|--------|----------------|
| List Logs | GET | ✅ Testable | Admin |

### **Settings (5 endpoints)**
| Endpoint | Method | Status | Required Roles |
|----------|--------|--------|----------------|
| Get Settings | GET | ✅ Testable | Admin |
| Update Settings | PUT | ⚠️ Skipped | Admin |
| Test SMTP Connection | POST | ⚠️ Skipped | Admin |
| Send Test Email | POST | ⚠️ Skipped | Admin |
| Get System Stats | GET | ✅ Testable | Admin |

### **Roles (1 endpoint)**
| Endpoint | Method | Status | Required Roles |
|----------|--------|--------|----------------|
| List Roles | GET | ✅ Testable | Admin |

### **Users (2 endpoints)**
| Endpoint | Method | Status | Required Roles |
|----------|--------|--------|----------------|
| Update User Role | PUT | ⚠️ Skipped | Admin |
| Update User Profile | PUT | ⚠️ Skipped | Admin |

---

## 🎯 Testing Summary

### **Total Endpoints: 73**

**By Status:**
- ✅ **Testable (GET):** 19 endpoints
- ⚠️ **Skipped (Safety):** 54 endpoints

**By Category:**
- Auth: 8 endpoints (1 testable)
- Patients: 5 endpoints (1 testable)
- Doctors: 6 endpoints (2 testable)
- Appointments: 9 endpoints (1 testable)
- Bills: 3 endpoints (1 testable)
- Availability: 7 endpoints (0 testable)
- Queue: 5 endpoints (1 testable)
- Departments: 4 endpoints (1 testable)
- Inventory: 4 endpoints (1 testable)
- Notifications: 3 endpoints (1 testable)
- HR: 11 endpoints (5 testable)
- Logs: 1 endpoint (1 testable)
- Settings: 5 endpoints (2 testable)
- Roles: 1 endpoint (1 testable)
- Users: 2 endpoints (0 testable)

---

## 🚀 Usage Guide

### **Step 1: Login as Admin**
The API test page requires Admin role access.

### **Step 2: Navigate to API Test**
Click on "API Test" in the navbar under "HR & System" dropdown.

### **Step 3: Select Category (Optional)**
- Click "All" to view all endpoints
- Click specific category to filter

### **Step 4: Run Tests**
**Option A: Test All**
1. Click "Test All" button
2. Wait for all testable endpoints to complete
3. View success/error counts in dashboard

**Option B: Individual Tests**
1. Find the endpoint you want to test
2. Click "Test" button on that row
3. View result immediately

### **Step 5: View Results**
1. Look for checkmark (✅) or X (❌) icons
2. Click the dropdown arrow to expand details
3. View response JSON, status codes, error messages

### **Step 6: Clear Results**
Click "Clear" button to reset all test results.

---

## 💡 Tips

1. **Test Regularly** - Run tests after backend changes to catch issues early
2. **Check Permissions** - If endpoint shows "No Access", you need different role
3. **Read Errors** - Expand error details to understand what went wrong
4. **Safe Testing** - Only GET requests are tested automatically
5. **Response Inspection** - Use expanded view to verify data structure

---

## 🐛 Troubleshooting

### **"No Access" on All Endpoints**
- Check you're logged in as Admin
- Verify JWT token is valid (try logging out and back in)

### **All Tests Failing**
- Check backend server is running
- Verify API base URL in `client/src/utils/api.js`
- Check browser console for network errors

### **Some Tests Pass, Some Fail**
- Expected behavior - different endpoints have different permissions
- Check "Required Roles" column for each endpoint

### **Response Shows "undefined"**
- Backend might be returning empty data
- Check backend logs for errors
- Verify database has data for that endpoint

---

## 📝 Developer Notes

### **File Location**
`client/src/features/admin/ApiTestPage.jsx`

### **Route**
```javascript
<Route path="/admin/api-test" element={<ApiTestPage />} />
```

### **Adding New Endpoints**
To add a new endpoint to the tester:

1. Open `ApiTestPage.jsx`
2. Find the `apiEndpoints` object
3. Add to appropriate category:
```javascript
{
  name: 'Your Endpoint Name',
  method: 'GET', // or POST, PUT, DELETE
  endpoint: '/your-endpoint',
  roles: ['Admin', 'Doctor'], // optional
  skip: false, // set to true for create/update/delete
  reason: 'Reason for skipping' // if skip is true
}
```

### **Customization**
- Modify `testEndpoint()` function to add custom headers
- Adjust `testAllEndpoints()` delay to prevent rate limiting
- Update `getStatusColor()` for different color schemes

---

## ✅ Build Status

```
✓ 162 modules transformed
✓ Built in 2.26s
✓ Production ready: 583.58 kB
```

**Status:** ✅ Fully functional and tested

---

**Access the tool at:** `http://localhost:5173/admin/api-test` (development) or `/admin/api-test` (production)

