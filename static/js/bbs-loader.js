(function() {
  var box = document.getElementById("bbs-posts");
  if (!box) return;
  var tid = parseInt(box.dataset.tid, 10);
  var fid = parseInt(box.dataset.fid, 10);
  if (!tid || !fid) return;

  function fetchJSON(url) {
    return fetch(url).then(function(r) {
      if (!r.ok) throw new Error("not found");
      return r.json();
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  function render(posts) {
    if (posts.length === 0) {
      box.innerHTML = '<p class="bbs-empty">此主題無帖子</p>';
      return;
    }
    posts.sort(function(a, b) { return a.pid - b.pid; });
    var html = "";
    posts.forEach(function(p) {
      var d = new Date(p.dateline * 1000);
      var ds = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
      var au = p.author ? esc(p.author) : "匿名";
      var su = p.subject ? esc(p.subject) : "";
      var ms = (p.message || "").replace(/\n/g, "<br>");
      html += '<div class="bbs-post">';
      if (su) html += '<div class="bbs-post-subject">' + su + '</div>';
      html += '<div class="bbs-post-meta">' + au + ' · ' + ds + ' · #' + p.pid + '</div>';
      html += '<div class="bbs-post-body">' + ms + '</div></div>';
    });
    box.innerHTML = html;
  }

  function loadAndFilter(urls) {
    return Promise.all(urls.map(function(u) {
      return fetchJSON(u).catch(function() { return []; });
    })).then(function(arrays) {
      var all = [];
      arrays.forEach(function(a) { all = all.concat(a); });
      return all.filter(function(p) { return p.tid === tid; });
    });
  }

  var fidStr = String(fid).padStart(2, "0");
  var indexUrl = "/data/posts-fid" + fidStr + "-index.json";

  // 先讀 index 檔，決定要載入哪些 chunk
  fetchJSON(indexUrl).then(function(index) {
    var chunkSet = {};
    var tidStr = String(tid);
    if (index[tidStr] && index[tidStr].length > 0) {
      // 只載入這個 tid 出現的 chunk
      index[tidStr].forEach(function(n) { chunkSet[n] = true; });
    } else {
      // tid 不在 index 裡，載入全部（fallback）
      for (var i = 1; i <= 58; i++) { chunkSet[i] = true; }
    }
    var urls = [];
    Object.keys(chunkSet).forEach(function(n) {
      urls.push("/data/posts-fid" + fidStr + "-p" + String(n).padStart(2, "0") + ".json");
    });
    return loadAndFilter(urls);
  }).catch(function() {
    // index 檔讀取失敗，載入全部（fallback）
    var urls = [];
    for (var i = 1; i <= 58; i++) {
      urls.push("/data/posts-fid" + fidStr + "-p" + String(i).padStart(2, "0") + ".json");
    }
    return loadAndFilter(urls);
  }).then(render).catch(function(e) {
    box.innerHTML = '<p class="bbs-error">載入失敗：' + e.message + '</p>';
  });
})();