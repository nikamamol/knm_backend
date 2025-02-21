const express = require("express");



const {
    signup,
    login,
    logout,
    sendOtp,
    verifyOtp,
    accessuser,
    getAllUsers,
    viewUserById,
    updateUser,
    deleteUserById,
    inviteagency,
    myAgencyData,
    updateAgency,
    viewAgencyById,
    deleteAgencyById,
    addClient,
    viewClient,
    updateClient,
    viewClientDetails,
    deleteClient,
    uploadCsv,
    createCampaign,
    getAllCampaigns,
    updateCampaignById,
    getCampaignById,
    addTemplate,
    getTemplates,
    getTemplateById,
    getUserDetails,
    getCsvFiles,
    getCsvFileById,
    qualityCheck,
    updateStatus,
    emailCheck,
    deleteFile,
    getUserData,
    getCurrentUser,
    getCsvByRAFiles,
    getExcelFiles,
    updateCsvFileById,
    uploadOperationCsvFile,
    getCsvFilesByOperation,
    getCsvFilesByOperationAll,
    getCsvFileByIdOperation,
    downloadCsvFileById,
    downloadCampaignFile,
    uploadCsvByQuality,
    createInvoice,
    getInvoices,
    getInvoiceById,
    deleteInvoiceById,
    uploadRaMasterCsvFile,
    getCsvFilesByRAMasterAll,
    getRaMasterCsvFileById,
    deleteRaMasterCsvFileById,
    uploadQualityCheckedCsvFile,
    getCsvFilesByQualityCheckedAll,
    getQualityCheckedCsvFileById,
    deleteQualityCheckedCsvFileById,
    uploadQualityMasterCsvFile,
    getCsvFilesByQualityMasterAll,
    getQualityMasterCsvFileById,
    deleteQualityMasterCsvFileById,
    uploadEMCheckedCsvFile,
    getCsvFilesByEMCheckedAll,
    getEMCheckedCsvFileById,
    deleteEMCheckedCsvFileById,
    uploadEMMasterCsvFile,
    getCsvFilesByEMMasterAll,
    getEMMasterCsvFileById,
    deleteEMMasterCsvFileById,
    operationMasterCsvFile,
    getCsvFilesByOpMasterAll,
    getOPMasterCsvFileById,
    deleteOPMasterCsvFileById,
    unwantedLeadsCsvFile,
    getCsvFilesByUnwantedLeadsAll,
    getUnwantedCsvFileById,
    deleteUnwantedCsvFileById,
    updateCampaignStatus,
    getAllRegisterUsers,
    getDailyLogins,
    getDailyLogouts,
    saveComment,
    deleteOperationCsvFileById,
    uploadSuppressionortalCsvFile,
    getCsvFilesByseppression,
    getSeparationCsvFileById,
    deleteSeparationCsvFileById,
    getAllMessages,
    saveMessage1,
    eventsGet,
    eventsPost,
    uploadRaTL,
    getCsvFilesByRatlAll,
    getCsvFileByIdtl,
    deleteRatlCsvFileById,
    uploadCsvByTl,
    updateStatusTl,
    downloadCsvFileByIdRa,
    eventDelete,
    eventUpdate,
    eventGetById
} = require("../controller/auth");

const UserAuthRouter = express.Router();

UserAuthRouter.post('/createCalendarEvent', eventsPost);
UserAuthRouter.get('/eventsGet', eventsGet);
UserAuthRouter.get('/eventsGet/:id', eventGetById);
UserAuthRouter.delete('/eventDelete/:id', eventDelete);
UserAuthRouter.put('/eventUpdate/:id', eventUpdate);
UserAuthRouter.post("/signup", signup);
UserAuthRouter.post("/login", login);
UserAuthRouter.post("/logout", logout);
UserAuthRouter.post("/send-otp", sendOtp);
UserAuthRouter.post("/verify-otp", verifyOtp);
UserAuthRouter.get("/userdetails", getUserDetails);
UserAuthRouter.post("/getDailyLogouts", getDailyLogouts);
UserAuthRouter.get("/getallregisterusers", getAllRegisterUsers);
UserAuthRouter.get("/getdailylogins", getDailyLogins);

// user
UserAuthRouter.post("/addnewuser", accessuser);
UserAuthRouter.get("/getallusers", getAllUsers);
UserAuthRouter.get("/viewuserbyid/:id", viewUserById);
UserAuthRouter.put("/updateuser/:id", updateUser);
UserAuthRouter.delete("/deleteuser/:id", deleteUserById);
UserAuthRouter.post("/saveComment", saveComment);
// add agency
UserAuthRouter.post("/invitagency", inviteagency);
UserAuthRouter.get("/myagencies", myAgencyData);
UserAuthRouter.get("/viewAgencyDetails/:id", viewAgencyById);
UserAuthRouter.put("/updateAgency/:id", updateAgency);
UserAuthRouter.delete("/deletevendor/:id", deleteAgencyById);
// counter

// billing
UserAuthRouter.post("/addnewClient", addClient);
UserAuthRouter.get("/getAllClient", viewClient);
UserAuthRouter.get("/clientDetails/:id", viewClientDetails);
UserAuthRouter.put("/updateClient/:id", updateClient);
UserAuthRouter.delete("/deleteClient/:id", deleteClient);

// create campaign
UserAuthRouter.post("/createcampaign", createCampaign);
UserAuthRouter.get("/getCampaignsData", getAllCampaigns);
UserAuthRouter.get("/getCampaignsDataById/:id", getCampaignById);
UserAuthRouter.put("/updateCampaignById/:id", updateCampaignById);
UserAuthRouter.put("/campaigns/:id", updateCampaignStatus);

// rpf
UserAuthRouter.post("/uploadcsv", uploadCsv);
UserAuthRouter.get("/csvFileData", getCsvByRAFiles);
UserAuthRouter.get("/csvFileAllData", getCsvFiles);
UserAuthRouter.post("/uploadratl", uploadCsvByTl);
UserAuthRouter.get("/getratlcsvfile", getCsvFilesByRatlAll);
UserAuthRouter.get("/getCsvFileByIdtl/:id", getCsvFileByIdtl);
UserAuthRouter.delete("/deleteRatlCsvFileById/:id", deleteRatlCsvFileById);




UserAuthRouter.get("/csvFileData/:id", getCsvFileById);
UserAuthRouter.get("/downloadCsvFileById/:id", downloadCsvFileById);
UserAuthRouter.get("/downloadCsvFileByIdRa/:id", downloadCsvFileByIdRa);
UserAuthRouter.put("/updateStatus/:id", updateStatus);
UserAuthRouter.put("/updateStatus_rl_tl/:id", updateStatusTl);
UserAuthRouter.delete("/csvFileData/:id", deleteFile);
UserAuthRouter.get("/readexcel/:id", getExcelFiles);
UserAuthRouter.put("/updateCsvFileById/:id", updateCsvFileById);
// RA Master File
UserAuthRouter.post("/uploadramastercsv", uploadRaMasterCsvFile);
UserAuthRouter.get("/getramasterCsvFileData", getCsvFilesByRAMasterAll);
UserAuthRouter.get("/getramasterCsvFileData/:id", getRaMasterCsvFileById);
UserAuthRouter.delete(
    "/deleteRaMasterCsvFileById/:id",
    deleteRaMasterCsvFileById
);
// Quality Check
UserAuthRouter.post(
    "/uploadQualityCheckedCsvFile",
    uploadQualityCheckedCsvFile
);
UserAuthRouter.get(
    "/getCsvFilesByQualityCheckedAll",
    getCsvFilesByQualityCheckedAll
);
UserAuthRouter.get(
    "/getQualityCheckedCsvFileById/:id",
    getQualityCheckedCsvFileById
);
UserAuthRouter.delete(
    "/deleteQualityCheckedCsvFileById/:id",
    deleteQualityCheckedCsvFileById
);
//Email Check
UserAuthRouter.post("/uploadEMCheckedCsvFile", uploadEMCheckedCsvFile);
UserAuthRouter.get("/getCsvFilesByEMCheckedAll", getCsvFilesByEMCheckedAll);
UserAuthRouter.get("/getEMCheckedCsvFileById/:id", getEMCheckedCsvFileById);
UserAuthRouter.delete(
    "/deleteEMCheckedCsvFileById/:id",
    deleteEMCheckedCsvFileById
);
// quality master
UserAuthRouter.post("/uploadQualityMasterCsvFile", uploadQualityMasterCsvFile);
UserAuthRouter.get("/qualityMasterCsvFile", getCsvFilesByQualityMasterAll);
UserAuthRouter.get(
    "/getQualityMasterCsvFileById/:id",
    getQualityMasterCsvFileById
);
UserAuthRouter.delete(
    "/deleteQualityMasterCsvFileById/:id",
    deleteQualityMasterCsvFileById
);
//Email master
UserAuthRouter.post("/uploadEMMasterCsvFile", uploadEMMasterCsvFile);
UserAuthRouter.get("/getCsvFilesByEMMasterAll", getCsvFilesByEMMasterAll);
UserAuthRouter.get("/getEMMasterCsvFileById/:id", getEMMasterCsvFileById);
UserAuthRouter.delete(
    "/deleteEMMasterCsvFileById/:id",
    deleteEMMasterCsvFileById
);

// Delivery
UserAuthRouter.post("/operationCsvFile", uploadOperationCsvFile);
UserAuthRouter.get("/getCsvDatabyOperation", getCsvFilesByOperation);
UserAuthRouter.get("/getCsvDatabyOperationAll", getCsvFilesByOperationAll);
UserAuthRouter.get("/getCsvFileByIdOperation/:id", getCsvFileByIdOperation);
UserAuthRouter.delete(
    "/deleteOperationCsvFileById/:id",
    deleteOperationCsvFileById
);
//unwanted Leads
UserAuthRouter.post("/unwantedLeadsCsvFile", unwantedLeadsCsvFile);
UserAuthRouter.get(
    "/getCsvFilesByUnwantedLeadsAll",
    getCsvFilesByUnwantedLeadsAll
);
UserAuthRouter.get("/getUnwantedCsvFileById/:id", getUnwantedCsvFileById);
UserAuthRouter.delete(
    "/deleteUnwantedCsvFileById/:id",
    deleteUnwantedCsvFileById
);
//Delivery master csv file
UserAuthRouter.post("/operationMasterCsvFile", operationMasterCsvFile);
UserAuthRouter.get("/getCsvFilesByOpMasterAll", getCsvFilesByOpMasterAll);
UserAuthRouter.get("/getOPMasterCsvFileById/:id", getOPMasterCsvFileById);
UserAuthRouter.delete(
    "/deleteOPMasterCsvFileById/:id",
    deleteOPMasterCsvFileById
);
// suppression
UserAuthRouter.post(
    "/uploadSuppressionortalCsvFile",
    uploadSuppressionortalCsvFile
);
UserAuthRouter.get("/getCsvFilesByseppression", getCsvFilesByseppression);
UserAuthRouter.get("/getSeparationCsvFileById/:id", getSeparationCsvFileById);
UserAuthRouter.delete(
    "/deleteSeparationCsvFileById/:id",
    deleteSeparationCsvFileById
);
// create template
UserAuthRouter.post("/createTemplate", addTemplate);
UserAuthRouter.get("/getTemplateData", getTemplates);
UserAuthRouter.get("/templates/:id", getTemplateById);

// Invoice
UserAuthRouter.post("/createInvoice", createInvoice);
UserAuthRouter.get("/getInvoices", getInvoices);
UserAuthRouter.get("/getInvoiceById/:id", getInvoiceById);
UserAuthRouter.delete("/deleteInvoiceById/:id", deleteInvoiceById);

// support 

UserAuthRouter.post("/message", saveMessage1);
UserAuthRouter.get("/get_all_message", getAllMessages);




module.exports = UserAuthRouter;