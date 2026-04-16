import "./index.css";
import { Composition } from "remotion";
import { WinWin } from "./WinWin";
import { Anteile } from "./Anteile";
import { IntroBg } from "./IntroBg";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WinWin"
        component={WinWin}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Anteile"
        component={Anteile}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="IntroBg"
        component={IntroBg}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
