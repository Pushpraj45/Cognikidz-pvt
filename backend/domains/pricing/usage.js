const { ComboPackage, UserPurchase } = require('./model');

const normalizeBaseType = (type) => {
  if (!type) return '';
  const t = String(type).toLowerCase();
  if (t.startsWith('autism') || t === 'asd') return 'autism';
  if (t.startsWith('adhd')) return 'adhd';
  if (t.startsWith('dyslexia')) return 'dyslexia';
  if (t.startsWith('general')) return 'general';
  return t;
};

const doesPurchaseCover = async (purchase, { resourceType, resourceKey, assessmentType }) => {
  if (purchase.paymentStatus !== 'completed' || !purchase.isActive) return false;
  if (resourceType === 'assessment') {
    if (purchase.purchaseType === 'individual') {
      // Exact individual assessment type or same base (form/image equivalence)
      if (purchase.assessmentType === assessmentType) return true;
      const basePurchase = normalizeBaseType(purchase.assessmentType);
      const baseRequested = normalizeBaseType(assessmentType);
      return basePurchase && basePurchase === baseRequested;
    }
    const pkg = await ComboPackage.findOne({ packageId: purchase.packageId, isActive: true });
    if (!pkg) return false;
    const baseRequested = normalizeBaseType(assessmentType);
    return pkg.includedAssessments.some(a => {
      const incl = a?.assessmentType;
      if (!incl) return false;
      if (incl === assessmentType) return true;
      const inclBase = normalizeBaseType(incl);
      return inclBase === baseRequested;
    });
  }
  if (resourceType === 'game' || resourceType === 'suite') {
    const isADHD = resourceKey.includes('adhd');
    const isDyslexia = resourceKey.includes('dyslexia');
    const requiredType = isADHD ? 'adhd-game' : isDyslexia ? 'dyslexia-game' : null;
    if (!requiredType) return false;
    if (purchase.purchaseType === 'individual') {
      if (purchase.assessmentType === requiredType) return true;
      const basePurchase = normalizeBaseType(purchase.assessmentType);
      const baseRequired = normalizeBaseType(requiredType);
      return basePurchase && basePurchase === baseRequired;
    }
    const pkg = await ComboPackage.findOne({ packageId: purchase.packageId, isActive: true });
    return !!pkg && pkg.includedAssessments.some(a => {
      const incl = a?.assessmentType;
      if (!incl) return false;
      if (incl === requiredType) return true;
      const inclBase = normalizeBaseType(incl);
      return inclBase === normalizeBaseType(requiredType);
    });
  }
  return false;
};

const findAllCoveringPurchases = async (userId, criteria) => {
  const purchases = await UserPurchase.find({ userId, paymentStatus: 'completed', isActive: true }).sort({ createdAt: -1 });
  const covering = [];
  for (const p of purchases) {
    // eslint-disable-next-line no-await-in-loop
    if (await doesPurchaseCover(p, criteria)) covering.push(p);
  }
  return covering;
};

const USAGE_LIMITS = {
  assessment: 1, // text/image one-time per purchased assessment type
  suite: 1, // progressive suite once
  game: 3, // each individual game three times
};

const checkUsage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { resourceType = 'assessment', resourceKey, assessmentType } = req.body;

    if (resourceType === 'assessment' && assessmentType === 'general-form') {
      const freeKey = 'general-form';
      // Limit free general assessment attempts to 5 total per user
      const purchases = await UserPurchase.find({ userId, paymentStatus: 'completed', isActive: true });
      // Use a synthetic usage record attached to the most recent completed or any existing purchase
      // If no purchase exists, create a synthetic in-memory usage baseline (we'll allow increment to create one via latest purchase)
      const attachTarget = purchases[0];
      let usage = (attachTarget?.metadata?.usage) || {};
      const count = usage[freeKey] || 0;
      const limit = 5;
      const allowed = count < limit;
      return res.json({ success: true, allowed, remaining: Math.max(0, limit - count) });
    }

    const coveringPurchases = await findAllCoveringPurchases(userId, { resourceType, resourceKey, assessmentType });
    if (!coveringPurchases || coveringPurchases.length === 0) {
      return res.json({ success: true, allowed: false, reason: 'payment_required' });
    }

    const limitPerPurchase = USAGE_LIMITS[resourceType] || 1;
    const totalLimit = coveringPurchases.length * limitPerPurchase;
    let totalCount = 0;
    for (const p of coveringPurchases) {
      const usage = p.metadata?.usage || {};
      totalCount += usage[resourceKey] || 0;
    }
    const allowed = totalCount < totalLimit;
    return res.json({ success: true, allowed, remaining: Math.max(0, totalLimit - totalCount) });
  } catch (error) {
    console.error('Usage check error:', error);
    res.status(500).json({ success: false, message: 'Usage check failed' });
  }
};

const incrementUsage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { resourceType = 'assessment', resourceKey, assessmentType } = req.body;

    // Special handling for free general assessment usage
    if (resourceType === 'assessment' && assessmentType === 'general-form') {
      const purchases = await UserPurchase.find({ userId, isActive: true }).sort({ createdAt: -1 });
      const target = purchases[0] || new UserPurchase({ userId, purchaseType: 'individual', assessmentType: 'general-form', amount: 0, currency: 'INR', paymentMethod: 'admin-granted', paymentStatus: 'completed', isActive: true, metadata: {} });
      const freeKey = 'general-form';
      const limit = 5;
      const usage = target.metadata?.usage || {};
      const count = usage[freeKey] || 0;
      if (count >= limit) {
        return res.json({ success: true, allowed: false, remaining: 0 });
      }
      usage[freeKey] = count + 1;
      target.metadata = { ...(target.metadata || {}), usage };
      await target.save();
      return res.json({ success: true, allowed: true, remaining: Math.max(0, limit - usage[freeKey]) });
    }

    const coveringPurchases = await findAllCoveringPurchases(userId, { resourceType, resourceKey, assessmentType });
    if (!coveringPurchases || coveringPurchases.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid purchase found' });
    }
    const limitPerPurchase = USAGE_LIMITS[resourceType] || 1;
    // Find a purchase with remaining quota to increment
    let target = null;
    for (const p of coveringPurchases) {
      const usage = p.metadata?.usage || {};
      const cnt = usage[resourceKey] || 0;
      if (cnt < limitPerPurchase) { target = p; break; }
    }
    if (!target) {
      return res.json({ success: true, allowed: false, remaining: 0 });
    }
    const usage = target.metadata?.usage || {};
    const before = usage[resourceKey] || 0;
    usage[resourceKey] = before + 1;
    target.metadata = { ...(target.metadata || {}), usage };
    await target.save();

    // If just exhausted this purchase, optionally create a notification
    try {
      if (usage[resourceKey] >= limitPerPurchase) {
        const Notifications = require('../notifications/model');
        const title = 'Assessment access used';
        const message = `You have used your ${assessmentType} access.`;
        await Notifications.create({
          userId,
          type: 'usage',
          title,
          message,
          metadata: { resourceType, resourceKey, assessmentType, purchaseId: String(target._id) }
        });
      }
    } catch (e) {
      // ignore notification errors
    }

    const remainingInThis = Math.max(0, limitPerPurchase - usage[resourceKey]);
    return res.json({ success: true, allowed: true, remaining: remainingInThis });
  } catch (error) {
    console.error('Usage increment error:', error);
    res.status(500).json({ success: false, message: 'Usage increment failed' });
  }
};

module.exports = { checkUsage, incrementUsage, normalizeBaseType };


