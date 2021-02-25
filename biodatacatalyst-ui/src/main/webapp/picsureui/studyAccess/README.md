# Biodata Catalyst Data Access Dashboard Technical Overview

### Purpose and Overview
The purpose of the Data Access Dashboard functionality is to allow 
end-users to view all loaded studies and request access to studies that 
they don't currently have access to.  This functionality is enabled by 
two main routes: 1) a tab in the top menubar, and 2) capture errors from 
AJAX network requests that throw authentication errors.  This latter
functionality enables the showing of the Data Access Dashboard in the 
situation where a user is able to log in to PIC-SURE but does not have
access to any studies

## Technical Components
The functionality consists of the following components:

- Initialization code to download and process study list and create the
  Data Access button in the top menubar
- Display code to display the data access modal form with various handling
  of the modal form's "close" functionality
- Authentication error capture code which overrides the default 
  `transportErrors.js` in the base PIC-SURE UI codebase.
   
### Initialization
The initialization code consists of a small block of code in the `header.js`
and an `init` function in the `studyAccessFunctions.js` file.  In addition
to this code, the initialization process requires a data file currently
defined as `/picsureui/studyAccess/study-data.json` which contains a list 
containing the information of all studies loaded into the PIC-SURE environment.

The small code block that "hooks" the Data Access Dashboard functionality
into the web application's main code occurs in the header/headers.js code 
override file shown in the following link: [Initialization Hook Code](https://github.com/hms-dbmi/biodatacatalyst-pic-sure/blob/dbd8d330a3ac43f042bf8e8ec94af59eb94fa83c/biodatacatalyst-ui/src/main/webapp/picsureui/header/header.js#L40-L41).

This hook code then executes code to [create and attach a button to the top navigation bar](https://github.com/hms-dbmi/biodatacatalyst-pic-sure/blob/dbd8d330a3ac43f042bf8e8ec94af59eb94fa83c/biodatacatalyst-ui/src/main/webapp/picsureui/studyAccess/studyAccessFunctions.js#L60-L69)
while also [initializing the data access dashboard functionality](https://github.com/hms-dbmi/biodatacatalyst-pic-sure/blob/dbd8d330a3ac43f042bf8e8ec94af59eb94fa83c/biodatacatalyst-ui/src/main/webapp/picsureui/studyAccess/studyAccessFunctions.js#L10-L58).

### Display
The display code consists of two functions to display the dashboard's 
modal window in both [blocking](https://github.com/hms-dbmi/biodatacatalyst-pic-sure/blob/dbd8d330a3ac43f042bf8e8ec94af59eb94fa83c/biodatacatalyst-ui/src/main/webapp/picsureui/studyAccess/studyAccessFunctions.js#L84-L97), 
and [non-blocking](https://github.com/hms-dbmi/biodatacatalyst-pic-sure/blob/dbd8d330a3ac43f042bf8e8ec94af59eb94fa83c/biodatacatalyst-ui/src/main/webapp/picsureui/studyAccess/studyAccessFunctions.js#L71-L82)
ways.  By saying "blocking" we mean that when the modal window is closed
it also logs the user out of the application. In non-blocking display of
the modal, closing the form simply closes the form and the user is able 
to continue usage of the application. The event handler code for the 
created top menubar button [opens the modal form in non-blocking mode](https://github.com/hms-dbmi/biodatacatalyst-pic-sure/blob/dbd8d330a3ac43f042bf8e8ec94af59eb94fa83c/biodatacatalyst-ui/src/main/webapp/picsureui/studyAccess/studyAccessFunctions.js#L66).

There is also a small function to [show/hide "no-consent" studies](https://github.com/hms-dbmi/biodatacatalyst-pic-sure/blob/dbd8d330a3ac43f042bf8e8ec94af59eb94fa83c/biodatacatalyst-ui/src/main/webapp/picsureui/studyAccess/studyAccessFunctions.js#L103-L113).
This occures at the very bottom of the studies list.  "No-consent" studies
are studies in which consent was not given or was withdrawn. For the sake
of simplicity one should assume that these studies contain no usable data.

### Authentication

The Data Access Dashboard capture `HTTP 401 Authentication` errors by
overriding base transport error handling found in the `/picsureui/common/transportErrors.js` file.
The [transportErrors.js](https://github.com/hms-dbmi/biodatacatalyst-pic-sure/blob/dbd8d330a3ac43f042bf8e8ec94af59eb94fa83c/biodatacatalyst-ui/src/main/webapp/picsureui/common/transportErrors.js) 
file specifies the logic that when a HTTP 401 error occurs, and if the
user's authentication token is not expired, then initialize the data access
dashboard functionality and then show the modal form in a blocking manner
which will logout the user when they close the modal form.
