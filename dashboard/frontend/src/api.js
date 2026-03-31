import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export function streamJob(jobId, onLine, onDone) {
  const es = new EventSource(`/api/generation/jobs/${jobId}/stream`);
  es.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.type === 'done') {
      onDone(d);
      es.close();
    } else {
      if (typeof onLine === 'function') onLine(d.text);
    }
  };
  es.onerror = () => es.close();
  return es;
}

export function streamRun(runId, onLine, onDone) {
  const es = new EventSource(`/api/runs/${runId}/stream`);
  es.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.type === 'done') {
      onDone(d);
      es.close();
    } else {
      if (typeof onLine === 'function') onLine(d.text);
    }
  };
  es.onerror = () => es.close();
  return es;
}

export default api;
