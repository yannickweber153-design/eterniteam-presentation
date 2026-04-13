import "./index.css";
import { Composition } from "remotion";
import { WinWin } from "./WinWin";

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
    </>
  );
};
