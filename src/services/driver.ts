import { request } from 'umi';

export async function queryDirs({ params }): Promise<any> {
  return request('/api/driver/dirs', { params });
}

export async function queryDocuments({ params }): Promise<any> {
  return request('/api/driver/documents', { params });
}

export async function queryBreadcrumb({ params }): Promise<any> {
  return request('/api/driver/breadcrumb', { params });
}

export async function moveDocuments({ payload }): Promise<any> {
  return request(`/api/driver/documents/move`, {
    method: 'post',
    data: payload,
  });
}

export async function copyDocuments({ payload }): Promise<any> {
  return request(`/api/driver/documents/copy`, {
    method: 'post',
    data: payload,
  });
}

export async function deleteDocuments({ payload }): Promise<any> {
  return request(`/api/driver/documents/delete`, {
    method: 'post',
    data: payload,
  });
}

export async function updateDocuments({ payload }): Promise<any> {
  return request(`/api/driver/documents/update`, {
    method: 'post',
    data: payload,
  });
}

export async function getPresignedUrl({ type }): Promise<any> {
  return request(`/api/driver/presigned/${type}`);
}
