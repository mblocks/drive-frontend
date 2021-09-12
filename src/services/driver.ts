import { request } from 'umi';

export async function queryDirs({ params }): Promise<any> {
  const { parent, ...rest } = params;
  const res = await request('/api/driver/dirs', {
    params: parent == 'root' ? rest : params,
  });
  if (parent !== 'root') {
    return res;
  }
  return res.map((v) => ({ ...v, parent }));
}

export async function queryDocuments({ params }): Promise<any> {
  const { parent, ...rest } = params;
  const res = await request('/api/driver/documents', {
    params: parent == 'root' || parent == '' ? rest : params,
  });
  if (parent !== 'root') {
    return res;
  }
  return res.map((v) => ({ ...v, parent }));
}

export async function queryBreadcrumb({ params }): Promise<any> {
  const data = await request('/api/driver/breadcrumb', { params });
  return data.map((v) => ({ ...v, title: v.name }));
}

export async function moveDocuments({ payload }): Promise<any> {
  const { target, ...rest } = payload;
  return request(`/api/driver/documents/move`, {
    method: 'post',
    data: target == 'root' ? rest : payload,
  });
}

export async function copyDocuments({ payload }): Promise<any> {
  const { target, ...rest } = payload;
  const res = await request(`/api/driver/documents/copy`, {
    method: 'post',
    data: target == 'root' || target == '' ? rest : payload,
  });
  if (target == 'root' || target == '') {
    return res.map((v) => ({ ...v, parent: 'root' }));
  }
  return res;
}

export async function deleteDocuments({ payload }): Promise<any> {
  return request(`/api/driver/documents/delete`, {
    method: 'post',
    data: payload,
  });
}

export async function updateDocuments({ payload }): Promise<any> {
  const { parent, ...rest } = payload;
  if (rest.type == 'dir' && !rest.id) {
    const res = await request(`/api/driver/dirs`, {
      method: 'post',
      data: parent == 'root' || parent == '' ? rest : payload,
    });
    return parent == 'root' || parent == '' ? { ...res, parent: 'root' } : res;
  }
  return request(`/api/driver/documents/update`, {
    method: 'post',
    data: payload,
  });
}

export async function getPresignedUrl({ parent }): Promise<any> {
  return request(`/api/driver/presigned`, { params: { parent } });
}
