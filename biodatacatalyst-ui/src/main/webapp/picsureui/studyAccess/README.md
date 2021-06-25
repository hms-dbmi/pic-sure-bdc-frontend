# Biodata Catalyst Data Access Dashboard Technical Overview

### Purpose and Overview
The purpose of the Data Access Dashboard functionality is to allow 
end-users to view all loaded studies and request access to studies that 
they don't currently have access to.  This functionality is enabled by 
a tab in the top menubar.

## Technical Components
The functionality consists of the following components:

- Initialization code to download and process study list and create the
  Data Access button in the top menubar
- Backbone route handling to display the data access screen 
   
### Initialization
The initialization code exists within the `studyAccess.js` file and occurs
within the [Backbone view](https://github.com/hms-dbmi/biodatacatalyst-pic-sure/blob/ec5513de8c25fd436bfce19d8d039fd5af445c0e/biodatacatalyst-ui/src/main/webapp/picsureui/studyAccess/studyAccess.js#L22-L88) for the screen.  In addition
to this code, the initialization process requires a data file currently
defined as `/picsureui/studyAccess/study-data.json` which contains a list 
containing the information of all studies loaded into the PIC-SURE environment.

The small code block that "hooks" the Data Access Dashboard display functionality
into the web application's main code occurs in the `overrides/router.js` file 
shown in the following link: [Tab Navigation Code](https://github.com/hms-dbmi/biodatacatalyst-pic-sure/blob/ec5513de8c25fd436bfce19d8d039fd5af445c0e/biodatacatalyst-ui/src/main/webapp/picsureui/overrides/router.js#L5-L10).

### Display
The display code exists within the [standard render function](https://github.com/hms-dbmi/biodatacatalyst-pic-sure/blob/ec5513de8c25fd436bfce19d8d039fd5af445c0e/biodatacatalyst-ui/src/main/webapp/picsureui/studyAccess/studyAccess.js#L110-L164) of the Backbone view.

There is also a small function to [show/hide "no-consent" studies](https://github.com/hms-dbmi/biodatacatalyst-pic-sure/blob/ec5513de8c25fd436bfce19d8d039fd5af445c0e/biodatacatalyst-ui/src/main/webapp/picsureui/studyAccess/studyAccess.js#L94-L104).
This occures at the very bottom of the studies list.  "No-consent" studies
are studies in which consent was not given or was withdrawn. For the sake
of simplicity one should assume that these studies contain no usable data.
