const config = require("config.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Op } = require("sequelize");
const sendEmail = require("_helpers/send-email");
const db = require("_helpers/db");
const Role = require("_helpers/role");

module.exports = {
  authenticate,
  refreshToken,
  revokeToken,
  register,
  verifyEmail,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getAll,
  getActive,
  getById,
  create,
  update,
  delete: _delete,
};

async function authenticate({ email, password, ipAddress }) {
  const account = await db.Account.scope("withHash").findOne({
    where: { email },
  });

  if (
    !account ||
    !account.isVerified ||
    !(await bcrypt.compare(password, account.passwordHash))
  ) {
    throw "Email or password is incorrect";
  }

  // Authentication successful, generate jwt and refresh tokens
  const jwtToken = generateJwtToken(account);
  const refreshToken = generateRefreshToken(account, ipAddress);

  await refreshToken.save();

  // Return basic details and tokens
  return {
    ...basicDetails(account),
    jwtToken,
    refreshToken: refreshToken.token,
  };
}

async function refreshToken({ token, ipAddress }) {
  const refreshToken = await getRefreshToken(token);
  const account = await refreshToken.getAccount();

  const newRefreshToken = generateRefreshToken(account, ipAddress);
  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  refreshToken.replacedByToken = newRefreshToken.token;
  await refreshToken.save();
  await newRefreshToken.save();

  const jwtToken = generateJwtToken(account);

  return {
    ...basicDetails(account),
    jwtToken,
    refreshToken: newRefreshToken.token,
  };
}

async function revokeToken({ token, ipAddress }) {
  const refreshToken = await getRefreshToken(token);

  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  await refreshToken.save();
}

async function register(params, origin) {
  // Validate
  if (await db.Account.findOne({ where: { email: params.email } })) {
    // Send already registered error in email to prevent account enumeration
    return await sendAlreadyRegisteredEmail(params.email, origin);
  }

  const account = new db.Account(params);

  // First registered account is an admin
  const isFirstAccount = (await db.Account.count()) === 0;
  account.role = isFirstAccount ? Role.Admin : Role.User;
  account.verificationToken = randomTokenString();

  // Hash password
  account.passwordHash = await hash(params.password);

  await account.save();

  // Send email
  await sendVerificationEmail(account, origin);
}

async function verifyEmail({ token }) {
  const account = await db.Account.findOne({
    where: { verificationToken: token },
  });

  if (!account) throw "Verification failed";

  account.verified = Date.now();
  account.verificationToken = null;
  await account.save();
}

async function forgotPassword({ email }, origin) {
  const account = await db.Account.findOne({ where: { email } });

  // Return null if account doesn't exist
  if (!account) return;

  // Generate reset token that expires in 1 day
  account.resetToken = randomTokenString();
  account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
  await account.save();

  await sendPasswordResetEmail(account, origin);
}

async function validateResetToken({ token }) {
  const account = await db.Account.findOne({
    where: {
      resetToken: token,
      resetTokenExpires: { [Op.gt]: Date.now() },
    },
  });

  if (!account) throw "Invalid token";

  return account;
}

async function resetPassword({ token, password }) {
  const account = await validateResetToken({ token });

  // Update password and expiration
  account.passwordHash = await hash(password);
  account.passwordReset = Date.now();
  account.resetToken = null;
  await account.save();
}

async function getAll() {
  const accounts = await db.Account.findAll();
  return accounts.map((x) => basicDetails(x));
}

async function getActive() {
  const accounts = await db.Account.findAll({
    where: { isActive: true },
  });
  return accounts.map((x) => basicDetails(x));
}

async function getById(id) {
  const account = await getAccount(id);
  return basicDetails(account);
}

async function create(params) {
  // Validate email uniqueness
  if (await db.Account.findOne({ where: { email: params.email } })) {
    throw 'Email "' + params.email + '" is already registered';
  }

  // Validate required fields
  if (!params.password) {
    throw "Password is required";
  }

  const account = new db.Account({
    email: params.email,
    title: params.title,
    firstName: params.firstName,
    lastName: params.lastName,
    role: params.role,
    isActive: params.isActive !== undefined ? params.isActive : true,
    verified: Date.now(), // Auto-verify accounts created by admin
  });

  // Hash password
  account.passwordHash = await hash(params.password);

  await account.save();

  console.log("Account created:", account.email);

  return basicDetails(account);
}

async function update(id, params) {
  const account = await getAccount(id);

  if (
    params.email &&
    account.email !== params.email &&
    (await db.Account.findOne({ where: { email: params.email } }))
  ) {
    throw 'Email "' + params.email + '" is already taken';
  }

  if (params.password) {
    params.passwordHash = await hash(params.password);
  }

  Object.assign(account, params);
  account.updated = Date.now();
  await account.save();

  return basicDetails(account);
}

async function _delete(id) {
  const account = await getAccount(id);
  await account.destroy();
}

async function getAccount(id) {
  const account = await db.Account.findByPk(id);
  if (!account) throw "Account not found";
  return account;
}

async function getRefreshToken(token) {
  const refreshToken = await db.RefreshToken.findOne({ where: { token } });
  if (!refreshToken || !refreshToken.isActive) throw "Invalid token";
  return refreshToken;
}

async function hash(password) {
  return await bcrypt.hash(password, 10);
}

function generateJwtToken(account) {
  return jwt.sign({ sub: account.id, id: account.id }, config.secret, {
    expiresIn: "15m",
  });
}

function generateRefreshToken(account, ipAddress) {
  return new db.RefreshToken({
    accountId: account.id,
    token: randomTokenString(),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdByIp: ipAddress,
  });
}

function randomTokenString() {
  return crypto.randomBytes(40).toString("hex");
}

function basicDetails(account) {
  const {
    id,
    title,
    email,
    firstName,
    lastName,
    role,
    isActive,
    created,
    updated,
    isVerified,
  } = account;
  return {
    id,
    title,
    email,
    firstName,
    lastName,
    role,
    isActive,
    created,
    updated,
    isVerified,
  };
}

async function sendVerificationEmail(account, origin) {
  let message;
  if (origin) {
    const verifyUrl = `${origin}/accounts/verify-email?token=${account.verificationToken}`;
    message = `<p>Please click the below link to verify your email address:</p>
                   <p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
  } else {
    message = `<p>Please use the below token to verify your email address with the <code>/accounts/verify-email</code> api route:</p>
                   <p><code>${account.verificationToken}</code></p>`;
  }

  await sendEmail({
    to: account.email,
    subject: "Sign-up Verification API - Verify Email",
    html: `<h4>Verify Email</h4>
               <p>Thanks for registering!</p>
               ${message}`,
  });
}

async function sendAlreadyRegisteredEmail(email, origin) {
  let message;
  if (origin) {
    message = `<p>If you don't know your password please visit the <a href="${origin}/accounts/forgot-password">forgot password</a> page.</p>`;
  } else {
    message = `<p>If you don't know your password you can reset it via the <code>/accounts/forgot-password</code> api route.</p>`;
  }

  await sendEmail({
    to: email,
    subject: "Sign-up Verification API - Email Already Registered",
    html: `<h4>Email Already Registered</h4>
               <p>Your email <strong>${email}</strong> is already registered.</p>
               ${message}`,
  });
}

async function sendPasswordResetEmail(account, origin) {
  let message;
  if (origin) {
    const resetUrl = `${origin}/accounts/reset-password?token=${account.resetToken}`;
    message = `<p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                   <p><a href="${resetUrl}">${resetUrl}</a></p>`;
  } else {
    message = `<p>Please use the below token to reset your password with the <code>/accounts/reset-password</code> api route:</p>
                   <p><code>${account.resetToken}</code></p>`;
  }

  await sendEmail({
    to: account.email,
    subject: "Sign-up Verification API - Reset Password",
    html: `<h4>Reset Password Email</h4>
               ${message}`,
  });
}
