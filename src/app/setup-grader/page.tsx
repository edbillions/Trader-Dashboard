import { Orbitron, Rajdhani, Share_Tech_Mono } from "next/font/google";
import { UnicornGrader } from "./unicorn-grader";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-orbitron",
});
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
});
const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-share-tech-mono",
});

export default function SetupGraderPage() {
  return (
    <div className={`${orbitron.variable} ${rajdhani.variable} ${shareTechMono.variable}`}>
      <UnicornGrader />
    </div>
  );
}
