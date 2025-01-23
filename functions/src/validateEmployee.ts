export default /**
* Utility function to validate employee data
*/
function validateEmployeeData(data: any): { valid: boolean; message?: string } {
 if (!data.name || typeof data.name !== "string") {
   return { valid: false, message: "Employee name is required and must be a string." };
 }
 if (!data.email || typeof data.email !== "string") {
   return { valid: false, message: "Employee email is required and must be a string." };
 }
 if (data.age && typeof data.age !== "number") {
   return { valid: false, message: "Employee age must be a number." };
 }
 return { valid: true };
}