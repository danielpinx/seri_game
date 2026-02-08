export class InputManager {
  private keys = new Set<string>();
  private keysJustPressed = new Set<string>();
  private mousePos = { x: 0, y: 0 };
  private mouseButtons = new Set<number>();
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    canvas.addEventListener("mousemove", this.onMouseMove);
    canvas.addEventListener("mousedown", this.onMouseDown);
    canvas.addEventListener("mouseup", this.onMouseUp);
  }

  poll(): void {
    this.keysJustPressed.clear();
  }

  isKeyDown(key: string): boolean {
    return this.keys.has(key);
  }

  isKeyJustPressed(key: string): boolean {
    return this.keysJustPressed.has(key);
  }

  getMousePosition(): { x: number; y: number } {
    return this.mousePos;
  }

  isMouseDown(button: number = 0): boolean {
    return this.mouseButtons.has(button);
  }

  destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.keys.has(e.code)) this.keysJustPressed.add(e.code);
    this.keys.add(e.code);
    if (
      [
        "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space",
        "BracketLeft", "BracketRight", "Minus", "Equal",
      ].includes(e.code)
    ) {
      e.preventDefault();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.mousePos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  private onMouseDown = (e: MouseEvent): void => {
    this.mouseButtons.add(e.button);
  };

  private onMouseUp = (e: MouseEvent): void => {
    this.mouseButtons.delete(e.button);
  };
}
