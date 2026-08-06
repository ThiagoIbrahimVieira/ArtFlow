export default function handler(req: any, res: any) {
  return res.status(200).json({
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    error: null,
  });
}
