function debugDraw(ctx, canvas, world) {
  if (!ctx || !canvas || !world) return;

  // Bodenlinie + Label
  ctx.save();
  ctx.strokeStyle = '#00ff66';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);

  const gy = world.groundY + 0.5;
  ctx.beginPath();
  ctx.moveTo(0, gy);
  ctx.lineTo(canvas.width, gy);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = '#00ff66';
  ctx.font = '12px monospace';
  ctx.fillText(`GROUND_Y=${world.groundY}`, 8, gy - 6);
  ctx.restore();

  // Hitboxen & Attack-Ranges
  ctx.save();
  try {
    ctx.translate(world.camera_x, 0);

    const drawBox = (obj, color = '#ff4081') => {
      if (!obj) return;
      const r = Collision.rect(obj);
      if (!r) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    };

    drawBox(world.character, '#00e5ff');
    if (world.boss) drawBox(world.boss, '#ffab00');
    (world.enemies || []).forEach(e => drawBox(e, e.isDead ? '#f44336' : '#66bb6a'));
    (world.coins || []).forEach(c => drawBox(c, '#ffd54f'));
    drawBox(world.levelEndObject, '#ab47bc');

    const drawAtk = (obj, color = '#f44336') => {
      if (!obj || obj.attackRange == null) return;
      const base = Collision.rect(obj);
      if (!base) return;
      const facingLeft = !!obj.direction;
      const r = {
        x: facingLeft ? (base.x - obj.attackRange) : (base.x + base.w),
        y: base.y,
        w: obj.attackRange,
        h: base.h
      };
      ctx.strokeStyle = color;
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    };

    const c = world.character;
    if (c && (c.state === 'attack' || c.state === 'attack_extra')) drawAtk(c, '#ff1744');
    (world.enemies || []).forEach(e => { if (e?.isAttacking) drawAtk(e, '#ff9100'); });
    if (world.boss?.isAttacking) drawAtk(world.boss, '#ffab00');

  } catch (e) {
    // Schluckt Debug-Fehler absichtlich
  } finally {
    ctx.restore();
  }
}