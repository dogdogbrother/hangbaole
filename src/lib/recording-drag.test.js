import assert from "node:assert/strict";
import test from "node:test";
import { createRecordingDrag } from "./recording-drag.js";

function pointer(type, values = {}) {
  const event = new Event(type, { cancelable: true });
  Object.assign(event, {
    pointerId: 7,
    button: 0,
    isPrimary: true,
    clientX: 100,
    clientY: 100,
    ...values,
  });
  return event;
}

function setup() {
  const target = new EventTarget();
  const source = new EventTarget();
  const calls = [];
  source.setPointerCapture = (id) => calls.push(["capture", id]);
  source.releasePointerCapture = (id) => calls.push(["release", id]);
  const controller = createRecordingDrag({
    eventTarget: target,
    onMove: (preview) => calls.push(["move", preview]),
    onDrop: (event, item) => calls.push(["drop", event.clientX, item.id]),
    onEnd: () => calls.push(["end"]),
  });
  const item = { id: "snack", src: "snack.png", name: "零食" };
  const bounds = { left: 40, top: 50, width: 300, height: 200 };
  function start(values = {}) {
    // currentTarget is provided by the browser while the handler is running.
    source.addEventListener(
      "pointerdown",
      (event) => controller.start(event, item, bounds),
      { once: true },
    );
    source.dispatchEvent(pointer("pointerdown", values));
  }
  return { target, source, controller, calls, item, start };
}

test("moving preview retains image size and grab offset, then drops once", () => {
  const { target, controller, calls, item, start } = setup();
  start();
  assert.equal(controller.pending, true);
  target.dispatchEvent(pointer("pointermove", { clientX: 160, clientY: 125 }));
  assert.deepEqual(calls.at(-1), [
    "move",
    { item, x: 100, y: 75, width: 300, height: 200 },
  ]);
  target.dispatchEvent(pointer("pointerup", { clientX: 180, clientY: 130 }));
  assert.deepEqual(calls.slice(-4), [
    ["move", { item, x: 120, y: 80, width: 300, height: 200 }],
    ["drop", 180, "snack"],
    ["release", 7],
    ["end"],
  ]);
  assert.equal(controller.pending, false);
  const count = calls.length;
  target.dispatchEvent(pointer("pointermove", { clientX: 200 }));
  target.dispatchEvent(pointer("pointerup"));
  controller.cancel();
  assert.equal(calls.length, count);
});

test("a click or small movement does not move or rank the image", () => {
  const { target, controller, calls, start } = setup();
  start();
  target.dispatchEvent(pointer("pointermove", { clientX: 102, clientY: 102 }));
  target.dispatchEvent(pointer("pointerup", { clientX: 102, clientY: 102 }));
  assert.equal(controller.pending, false);
  assert.deepEqual(calls.map(([kind]) => kind), ["capture", "release", "end"]);
});

for (const cancellation of ["cancel", "blur", "resize", "pointercancel", "lostpointercapture"]) {
  test(`${cancellation} restores the source without assigning a tier`, () => {
    const { target, source, controller, calls, start } = setup();
    start();
    target.dispatchEvent(pointer("pointermove", { clientY: 120 }));
    if (cancellation === "cancel") controller.cancel();
    else if (cancellation === "lostpointercapture")
      source.dispatchEvent(pointer(cancellation));
    else target.dispatchEvent(pointer(cancellation));
    target.dispatchEvent(pointer("pointerup"));
    assert.equal(controller.pending, false);
    assert.equal(calls.filter(([kind]) => kind === "drop").length, 0);
    assert.equal(calls.filter(([kind]) => kind === "end").length, 1);
  });
}

test("other pointers and non-primary buttons cannot interfere", () => {
  const { target, source, controller, calls, start } = setup();
  start({ button: 2 });
  assert.equal(controller.pending, false);
  start({ isPrimary: false });
  assert.equal(controller.pending, false);
  start();
  target.dispatchEvent(pointer("pointermove", { pointerId: 8, clientX: 200 }));
  target.dispatchEvent(pointer("pointerup", { pointerId: 8 }));
  source.dispatchEvent(pointer("lostpointercapture", { pointerId: 8 }));
  assert.equal(controller.pending, true);
  assert.deepEqual(calls, [["capture", 7]]);
  controller.cancel();
});

test("the drag's synthetic click is consumed, but a new press is allowed", () => {
  const { target, controller, start } = setup();
  start();
  target.dispatchEvent(pointer("pointermove", { clientX: 160 }));
  target.dispatchEvent(pointer("pointerup", { clientX: 160 }));
  const click = pointer("click", { clientX: 160, detail: 1 });
  target.dispatchEvent(click);
  assert.equal(click.defaultPrevented, true);

  start();
  target.dispatchEvent(pointer("pointermove", { clientX: 160 }));
  target.dispatchEvent(pointer("pointerup", { clientX: 160 }));
  target.dispatchEvent(pointer("pointerdown", { clientX: 160 }));
  const deliberateClick = pointer("click", { clientX: 160, detail: 1 });
  target.dispatchEvent(deliberateClick);
  assert.equal(deliberateClick.defaultPrevented, false);
  controller.cancel();
});

test("DOMRect-like inherited bounds are retained", () => {
  const target = new EventTarget();
  const source = new EventTarget();
  let preview;
  const controller = createRecordingDrag({
    eventTarget: target,
    onMove: (value) => { preview = value; },
  });
  const bounds = Object.create({ left: 30, top: 40, width: 200, height: 100 });
  source.addEventListener("pointerdown", (event) => controller.start(event, {}, bounds));
  source.dispatchEvent(pointer("pointerdown"));
  target.dispatchEvent(pointer("pointermove", { clientX: 110 }));
  assert.deepEqual(preview, { item: {}, x: 40, y: 40, width: 200, height: 100 });
  controller.cancel();
});

test("drop callbacks can cancel safely without ending twice", () => {
  const target = new EventTarget();
  const source = new EventTarget();
  let endCount = 0;
  const controller = createRecordingDrag({
    eventTarget: target,
    onDrop: () => controller.cancel(),
    onEnd: () => { endCount += 1; },
  });
  source.addEventListener("pointerdown", (event) => controller.start(
    event, {}, { left: 0, top: 0, width: 100, height: 100 },
  ));
  source.dispatchEvent(pointer("pointerdown"));
  target.dispatchEvent(pointer("pointermove", { clientX: 130 }));
  target.dispatchEvent(pointer("pointerup", { clientX: 130 }));
  assert.equal(controller.pending, false);
  assert.equal(endCount, 1);
});
