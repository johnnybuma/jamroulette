import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static classes = ["hidden"];
  static targets = ["filterInput", "roomTile"];

  private _hiddenClass: string = ""; // Initialize _hiddenClass
  private _roomTileTargets: HTMLElement[] = []; // Initialize _roomTileTargets

  get hiddenClass(): string {
    return this._hiddenClass;
  }

  set hiddenClass(value: string) {
    this._hiddenClass = value;
  }

  get roomTileTargets(): HTMLElement[] {
    return this._roomTileTargets;
  }

  set roomTileTargets(value: HTMLElement[]) {
    this._roomTileTargets = value;
  }

  get filterInputTarget(): HTMLInputElement {
    return this.targets.find("filterInput") as HTMLInputElement;
  }

  get filterValue(): string {
    return this.filterInputTarget.value.toLowerCase();
  }

  filter() {
    const roomTiles = this.roomTileTargets;

    roomTiles.forEach((roomTile) => {
      const couldUseTags = roomTile.querySelector(
          ".could-use-tags"
      ) as HTMLElement;
      const visible =
          couldUseTags.innerText.toLowerCase().search(this.filterValue) >= 0;
      roomTile.classList.toggle(this.hiddenClass, !visible);
    });
  }
}
