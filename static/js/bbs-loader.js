(function() {
  var box = document.getElementById("bbs-posts");
  if (!box) return;
  var tid = box.dataset.tid;
  var fid = box.dataset.fid;
  if (!tid || !fid) return;
  var fidNum = parseInt(fid, 10);

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
    posts.sort(function(a, b) { return (a.pid || 0) - (b.pid || 0); });
    var html = "";
    posts.forEach(function(p) {
      var d = new Date((p.dateline || 0) * 1000);
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

  function filterByTid(posts) {
    return posts.filter(function(p) {
      return String(p.tid) === String(tid);
    });
  }

  function loadAndFilter(urls) {
    return Promise.all(urls.map(function(u) {
      return fetchJSON(u).catch(function() { return []; });
    })).then(function(arrays) {
      var all = [];
      arrays.forEach(function(a) { all = all.concat(a); });
      return filterByTid(all);
    });
  }

  var fidStr = String(fidNum).padStart(2, "0");
  var singleUrl = "/data/posts-fid" + fidStr + ".json";
  var indexUrl = "/data/posts-fid" + fidStr + "-index.json";

  fetchJSON(singleUrl).then(function(data) {
    var filtered = filterByTid(data);
    render(filtered);
  }).catch(function() {
    fetchJSON(indexUrl).then(function(index) {
      var chunkSet = {};
      var tidStr = String(tid);
      if (index[tidStr] && index[tidStr].length > 0) {
        index[tidStr].forEach(function(n) { chunkSet[n] = true; });
      } else {
        for (var i = 1; i <= 58; i++) { chunkSet[i] = true; }
      }
      var urls = [];
      Object.keys(chunkSet).forEach(function(n) {
        urls.push("/data/posts-fid" + fidStr + "-p" + String(n).padStart(2, "0") + ".json");
      });
      return loadAndFilter(urls);
    }).then(render).catch(function() {
      box.innerHTML = '<p class="bbs-empty">此主題無帖子</p>';
    });
  });
})();