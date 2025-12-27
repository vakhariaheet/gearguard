import { ac, Action } from '../../config/permissions';

/**
 * Validate if a user has permission to perform an action on a module
 *
 * @param userId - The user ID (for logging purposes)
 * @param role - The user's role
 * @param moduleName - The module/resource being accessed
 * @param actionName - The action being performed
 * @returns Promise<boolean> - Whether the user has permission
 */
export const validatePermissions = async (
  userId: string,
  role: string,
  moduleName: string,
  actionName: Action
): Promise<boolean> => {
  try {
    // Map simple action to accesscontrol method name
    const mappedAction = `${actionName}Any` as `${Action}Any`;

    // Check permission using accesscontrol
    const permission = ac.can(role)[mappedAction](moduleName);
    const granted = permission.granted;

    // Audit log for security monitoring
    console.info(
      `[Permission Check] userId=${userId}, role=${role}, ` +
        `action=${actionName}, module=${moduleName}, granted=${granted}`
    );

    return granted;
  } catch (error) {
    console.error('[Permission Check] Error validating permissions:', error);
    return false;
  }
};
