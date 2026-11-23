// Keep the moving picture in the page instead of relying on a native drag ghost.
export function createRecordingDrag({
  eventTarget = window,
  onMove,
  onDrop,
  onEnd,
}) {
  let session = null;
  let guardedClick = null;
  let clickTimer = null;

  function clearClickGuard() {
    clearTimeout(clickTimer);
    clickTimer = null;
    guardedClick = null;
    eventTarget.removeEventListener("click", suppressClick, true);
    eventTarget.removeEventListener("pointerdown", clearClickGuard, true);
  }

  function suppressClick(event) {
    if (!guardedClick || event.detail === 0) return;
    const matches =
      Math.abs(event.clientX - guardedClick.x) <= 4 &&
      Math.abs(event.clientY - guardedClick.y) <= 4 &&
      (event.pointerId == null ||
        event.pointerId < 0 ||
        event.pointerId === guardedClick.pointerId);
    clearClickGuard();
    if (!matches) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function guardClick(current) {
    clearClickGuard();
    guardedClick = {
      x: current.lastX,
      y: current.lastY,
      pointerId: current.pointerId,
    };
    eventTarget.addEventListener("click", suppressClick, true);
    // A new press is a deliberate new interaction, even at the same location.
    eventTarget.addEventListener("pointerdown", clearClickGuard, true);
    clickTimer = setTimeout(clearClickGuard, 350);
  }

  function finish(current) {
    if (session !== current) return;
    session = null;
    eventTarget.removeEventListener("pointermove", move, true);
    eventTarget.removeEventListener("pointerup", drop, true);
    eventTarget.removeEventListener("pointercancel", pointerCancel, true);
    eventTarget.removeEventListener("blur", cancel);
    eventTarget.removeEventListener("resize", cancel);
    current.source.removeEventListener("lostpointercapture", pointerCancel);
    try {
      current.source.releasePointerCapture?.(current.pointerId);
    } catch {
      // Capture can already have been released by the browser.
    }
    if (current.active) guardClick(current);
    onEnd?.();
  }

  function cancel() {
    if (session) finish(session);
  }

  function pointerCancel(event) {
    if (session && event.pointerId === session.pointerId) cancel();
  }

  function publish(current, event) {
    current.lastX = event.clientX;
    current.lastY = event.clientY;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (!current.active && Math.hypot(dx, dy) < 5) return;
    current.active = true;
    event.preventDefault();
    onMove?.(
      {
        item: current.item,
        x: current.bounds.left + dx,
        y: current.bounds.top + dy,
        width: current.bounds.width,
        height: current.bounds.height,
      },
      event,
    );
  }

  function move(event) {
    const current = session;
    if (!current || event.pointerId !== current.pointerId) return;
    try {
      publish(current, event);
    } catch (error) {
      finish(current);
      throw error;
    }
  }

  function drop(event) {
    const current = session;
    if (!current || event.pointerId !== current.pointerId) return;
    try {
      if (current.active) {
        publish(current, event);
        onDrop?.(event, current.item);
      }
    } finally {
      finish(current);
    }
  }

  return {
    start(event, item, bounds) {
      if (event.button !== 0 || event.isPrimary === false) return;
      cancel();
      clearClickGuard();
      const source = event.currentTarget;
      if (!source) return;
      session = {
        item,
        // DOMRect properties are prototype getters, so spreading loses them.
        bounds: {
          left: bounds.left,
          top: bounds.top,
          width: bounds.width,
          height: bounds.height,
        },
        source,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        active: false,
      };
      eventTarget.addEventListener("pointermove", move, {
        passive: false,
        capture: true,
      });
      eventTarget.addEventListener("pointerup", drop, true);
      eventTarget.addEventListener("pointercancel", pointerCancel, true);
      eventTarget.addEventListener("blur", cancel);
      eventTarget.addEventListener("resize", cancel);
      source.addEventListener("lostpointercapture", pointerCancel);
      try {
        source.setPointerCapture?.(event.pointerId);
      } catch {
        // Window listeners still track the pointer when capture is unavailable.
      }
    },
    cancel,
    get pending() {
      return session !== null;
    },
  };
}
