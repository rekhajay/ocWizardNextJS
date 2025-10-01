import { Employee } from '../types/cpif';

export class EmployeeService {
  private graphEndpoint = 'https://graph.microsoft.com/v1.0';
  private accessToken: string | null = null;

  constructor() {
    this.accessToken = this.getAccessToken();
  }

  private getAccessToken(): string | null {
    // Get token from Azure AD authentication
    if (typeof window !== 'undefined') {
      return localStorage.getItem('azure_access_token');
    }
    return null;
  }

  // Get all employees from Azure AD
  async getEmployees(): Promise<Employee[]> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(`${this.graphEndpoint}/users?$select=id,displayName,mail,jobTitle,department,manager`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.statusText}`);
      }

      const data = await response.json();
      return data.value.map((user: any) => ({
        id: user.id,
        displayName: user.displayName,
        email: user.mail || user.userPrincipalName,
        jobTitle: user.jobTitle || '',
        department: user.department || '',
        manager: user.manager?.displayName || ''
      }));
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      throw error;
    }
  }

  // Get employees by department
  async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    const employees = await this.getEmployees();
    return employees.filter(emp => 
      emp.department.toLowerCase().includes(department.toLowerCase())
    );
  }

  // Search employees by name
  async searchEmployees(searchTerm: string): Promise<Employee[]> {
    const employees = await this.getEmployees();
    return employees.filter(emp => 
      emp.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Get employee by ID
  async getEmployeeById(id: string): Promise<Employee | null> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(`${this.graphEndpoint}/users/${id}?$select=id,displayName,mail,jobTitle,department,manager`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const user = await response.json();
      return {
        id: user.id,
        displayName: user.displayName,
        email: user.mail || user.userPrincipalName,
        jobTitle: user.jobTitle || '',
        department: user.department || '',
        manager: user.manager?.displayName || ''
      };
    } catch (error) {
      console.error('Failed to fetch employee:', error);
      return null;
    }
  }

  // Get employees for dropdown options
  async getEmployeeOptions(): Promise<Array<{value: string, label: string, email: string, department: string}>> {
    const employees = await this.getEmployees();
    return employees.map(emp => ({
      value: emp.id,
      label: `${emp.displayName} (${emp.jobTitle})`,
      email: emp.email,
      department: emp.department
    }));
  }

  // Get employees by role (for specific dropdowns)
  async getEmployeesByRole(role: string): Promise<Employee[]> {
    const employees = await this.getEmployees();
    return employees.filter(emp => 
      emp.jobTitle.toLowerCase().includes(role.toLowerCase())
    );
  }
}

