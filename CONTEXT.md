# Glossary

* **Logout**: The action of a user signing out of the mobile application. A user is only permitted to log out if they have no active device connections. Logout is purely client-side state clearing after the server validates that the user is not actively connected to a device.
* **Active Device Connection**: A state where a physical device is linked to a user. Represented by `isActive: true` in the `TrDeviceUser` table. Must be explicitly disconnected before logout is permitted.
