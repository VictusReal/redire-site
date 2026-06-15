export default class CollisionSystem {
  // Returns list of enemies that touched the player this frame
  checkPlayerEnemyCollisions(player, enemies) {
    const hits = [];
    for (const e of enemies) {
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < player.radius + e.radius) {
        hits.push(e);
      }
    }
    return hits;
  }
}
