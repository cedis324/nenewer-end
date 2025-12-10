// 로그인 상태 확인 후 관리자 페이지 스크립트 초기화
(function initAdminPage(){
  fetch('/api/auth/status')
    .then(function(res){ return res.json(); })
    .then(function(data){
      if (!data || !data.isLoggedIn) {
        alert('\uB85C\uADF8\uC778\uD558\uC2ED\uC2DC\uC624');
        location.replace('/');
        return; // 미로그인: 이후 코드 실행 중단
      }
      // 로그인 상태일 때만 기존 로직 초기화
      startAdminMaintenance();
    })
    .catch(function(){
      alert('\uB85C\uADF8\uC778\uD558\uC2ED\uC2DC\uC624');
      location.replace('/');
    });
})();

function startAdminMaintenance(){
  // 상수 (한글 유니코드 이스케이프)
  const STATUS_RECEIVED = '\uC811\uC218';
  const STATUS_PROCESSING = '\uCC98\uB9AC\uC911';
  const STATUS_DONE = '\uC870\uCE58\uC644\uB8CC';
  const URGENCY_EMERGENCY = '\uAE34\uAE09';
  const URGENCY_NORMAL = '\uBCF4\uD1B5';
  const URGENCY_LOW = '\uB0AE\uC74C';

  // DOMContentLoaded가 이미 끝난 경우 즉시 초기화, 아니면 이벤트로 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

  function setup(){
    const urgencySelect = document.getElementById("filter-urgency");
    const statusSelect = document.getElementById("filter-status");
    const searchBtn = document.getElementById("search-btn");
    const exportBtn = document.getElementById("export-btn");
    const listDiv = document.getElementById("list");

    // 초기 로드
    loadList();
    if (searchBtn) searchBtn.addEventListener("click", () => loadList());
    if (exportBtn) exportBtn.addEventListener("click", () => doExport());

    async function loadList() {
      const urgency = urgencySelect ? urgencySelect.value : '';
      const status = statusSelect ? statusSelect.value : '';
      const params = new URLSearchParams();
      if (urgency) params.append("urgency", urgency);
      if (status) params.append("status", status);
      try {
        const res = await fetch(`/api/maintenance?${params}`);
        // 인증 실패 처리
        if (res.status === 401) {
          alert('\uB85C\uADF8\uC778\uD558\uC2ED\uC2DC\uC624');
          location.replace("/");
          return;
        }
        const result = await res.json();
        if (listDiv) listDiv.innerHTML = "";
        const records = result.data || [];
        
        if (!res.ok || !result.ok || records.length === 0) {
          if (listDiv) {
            const p = document.createElement('p');
            p.className='text-center text-gray-500 py-8';
            p.textContent='\uBBFC\uC6D0\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.'; 
            listDiv.appendChild(p); 
          }
          return; 
        }
        records.forEach(r => {
          const div = document.createElement("div");
          div.className = "border rounded p-4";
          const mainContainer = document.createElement("div");
          mainContainer.className = "flex justify-between";
          const leftContent = document.createElement("div");
          leftContent.className = "flex-1";
          const badgeContainer = document.createElement("div");
          badgeContainer.className = "flex items-center gap-2 mb-2";
          const statusBadge = document.createElement("span");
          statusBadge.className = "px-2 py-1 text-xs rounded";
          const s = r.status;
          statusBadge.textContent = s;
          statusBadge.className += s===STATUS_DONE ? ' bg-green-100 text-green-800' : (s===STATUS_PROCESSING ? ' bg-yellow-100 text-yellow-800' : ' bg-gray-100 text-gray-800');
          const urgencyBadge = document.createElement("span");
          urgencyBadge.className = "px-2 py-1 text-xs rounded";
          const u = r.urgency;
          urgencyBadge.textContent = u;
          urgencyBadge.className += u===URGENCY_EMERGENCY ? ' bg-red-100 text-red-800' : (u===URGENCY_NORMAL ? ' bg-blue-100 text-blue-800' : ' bg-gray-100 text-gray-800');
          const categorySpan = document.createElement("span");
          categorySpan.className = "text-sm text-gray-500";
          categorySpan.textContent = r.category;
          const studentInfoSpan = document.createElement("span");
          studentInfoSpan.className = "text-sm text-gray-600";
          studentInfoSpan.textContent = `${r.room} - ${r.studentName}(${r.studentId})`;
          badgeContainer.append(statusBadge, urgencyBadge, categorySpan, studentInfoSpan);
          const titleH4 = document.createElement("h4");
          titleH4.className = "font-semibold text-lg";
          titleH4.textContent = r.title;
          const descP = document.createElement("p");
          descP.className = "text-sm text-gray-600 mt-1";
          descP.textContent = r.description;
          const dateP = document.createElement("p");
          dateP.className = "text-xs text-gray-400 mt-2";
          dateP.textContent = new Date(r.createdAt).toLocaleString("ko-KR");
          leftContent.append(badgeContainer, titleH4, descP, dateP);
          const buttonContainer = document.createElement("div");
          buttonContainer.className = "flex flex-col gap-2 ml-4";
          if (s !== STATUS_DONE) {
            const processingBtn = document.createElement("button");
            processingBtn.className = "px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600";
            processingBtn.textContent = STATUS_PROCESSING;
            processingBtn.addEventListener("click", () => updateStatus(r._id || r.id, STATUS_PROCESSING));
            const completeBtn = document.createElement("button");
            completeBtn.className = "px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600";
            completeBtn.textContent = STATUS_DONE;
            completeBtn.addEventListener("click", () => updateStatus(r._id || r.id, STATUS_DONE));
            buttonContainer.append(processingBtn, completeBtn);
          }
          const deleteBtn = document.createElement("button");
          deleteBtn.className = "px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50";
          deleteBtn.textContent = "\uC0AD\uC81C";
          deleteBtn.addEventListener("click", () => deleteMaintenance(r._id || r.id));
          buttonContainer.appendChild(deleteBtn);
          mainContainer.append(leftContent, buttonContainer);
          div.append(mainContainer);
          if (listDiv) listDiv.append(div);
        });
      } catch (err) {
        alert("\uC870\uD68C \uC2E4\uD328: " + err.message);
      }
    }

    function doExport() {
      const urgency = urgencySelect ? urgencySelect.value : '';
      const status = statusSelect ? statusSelect.value : '';
      const params = new URLSearchParams();
      if (urgency) params.append("urgency", urgency);
      if (status) params.append("status", status);
      const url = `/api/maintenance/export?${params}`;
      // 임시 a 태그로 다운로드
      const a = document.createElement('a');
      a.href = url;
      a.download = 'maintenance.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    async function updateStatus(id, status) {
      if (!confirm(`\uC0C1\uD0DC\uB97C '${status}'\uB85C \uBCC0\uACBD\uD558\uC2DC\uACA0\uC2B5\uB2C8\uC544?`)) return;
      try {
        const res = await fetch(`/api/maintenance/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ status })
        });
        if (res.status === 401) {
          alert('\uB85C\uADF8\uC778\uD558\uC2ED\uC2DC\uC624');
          location.replace("/");
          return;
        }
        const result = await res.json();
        if (res.ok && result.ok) {
          alert("\uC0C1\uD0DC \uBCC0\uACBD \uC644\uB8CC");
          loadList();
        } else {
          alert("\uC0C1\uD0DC \uBCC0\uACBD \uC2E4\uD328: " + (result.message || "\uC624\uB958"));
        }
      } catch (err) {
        alert("\uC0C1\uD0DC \uBCC0\uACBD \uC624\uB958: " + err.message);
      }
    }

    async function deleteMaintenance(id) {
      if (!confirm("\uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uC544?")) return;
      try {
        const res = await fetch(`/api/maintenance/${id}`, { method: "DELETE" });
        if (res.status === 401) {
          alert('\uB85C\uADF8\uC778\uD558\uC2ED\uC2DC\uC624');
          location.replace("/");
          return;
        }
        const result = await res.json();
        if (res.ok && result.ok) {
          alert("\uC0AD\uC81C \uC644\uB8CC");
          loadList();
        } else {
          alert("\uC0AD\uC81C \uC2E4\uD328: " + (result.message || "\uC624\uB958"));
        }
      } catch (err) {
        alert("\uC0AD\uC81C \uC624\uB958: " + err.message);
      }
    }
  }
}
