import { LassaigneData } from "./types";

const LassaigneTestData: LassaigneData = {
  title: "Detection of Nitrogen, Sulphur, Chlorine, Bromine, and Iodine (Lassaigne's Test)",
  description:
    "Prepare sodium fusion extract and perform specific wet tests to detect nitrogen, sulphur, and halogens in organic compounds using color changes and precipitate formation.",
  stepDetails: [
    { id: 1, title: "Safety and Setup", description: "Wear goggles and gloves. Work behind a shield. Keep sodium under kerosene." },
    { id: 2, title: "Heat with Sodium", description: "Add a small sodium piece and the organic compound to an ignition tube and heat to red hot." },
    { id: 3, title: "Quench and Filter", description: "Quench hot tube in water, boil, crush, and filter to obtain sodium fusion extract." },
    { id: 4, title: "Nitrogen Test (Prussian Blue)", description: "To extract add FeSO₄, boil, cool, acidify with HCl, then add FeCl₃. Prussian blue confirms nitrogen." },
    { id: 5, title: "Sulphur Test (Lead Acetate)", description: "Acidify with acetic acid and add lead acetate. Black ppt indicates sulphur (PbS)." },
    { id: 6, title: "Sulphur Test (Nitroprusside)", description: "To alkaline extract add sodium nitroprusside. Purple color indicates sulphur." },
    { id: 7, title: "Remove Interference", description: "Boil a fresh portion with dilute HNO₃ to destroy CN⁻ and S²⁻ before halogen test." },
    { id: 8, title: "Halogen Test (AgNO₃)", description: "Add AgNO₃: white (Cl⁻), cream (Br⁻), yellow (I⁻)." },
    { id: 9, title: "Confirm with NH₃", description: "AgCl dissolves in dilute NH₃, AgBr in conc. NH₃, AgI insoluble." }
  ],
};

export default LassaigneTestData;
