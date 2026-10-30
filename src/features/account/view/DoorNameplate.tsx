import { characterSprites } from "../../../study/characterSprites";
import { defaultLook } from "../../character/model/layers";
import LayerStack from "../../character/view/LayerStack";

/**
 * 환영 화면의 방문 문패: 적고 있는 화면 이름이 나무 문패에 "이름의 방"으로 바로 새겨지고, 기본 모습의 내 캐릭터가 문패 아래 문 앞에 선다.
 * 로비 명패와 같은 물건이다. 입력칸이 실제 값이므로 장면 전체는 화면 낭독에서 감춘다.
 * @example <DoorNameplate name={form.nameInput} />
 */
export default function DoorNameplate({ name }: { name: string }) {
  const shown = name.trim();
  return (
    <div className="door-scene" aria-hidden="true">
      <div className="door-nameplate">
        {shown ? (
          <strong>
            {shown}
            <span>의 방</span>
          </strong>
        ) : (
          <strong className="is-empty">이름을 적어 주세요</strong>
        )}
      </div>
      <div className="door-character">
        <LayerStack look={defaultLook()} baseSrc={characterSprites.idle.down[0]} direction="down" label="" />
      </div>
    </div>
  );
}
